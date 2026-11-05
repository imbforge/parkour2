import csv
import itertools
import json
import logging
import re

from dateutil.relativedelta import relativedelta
from django.apps import apps
from django.db.models import Prefetch, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from xlwt import Workbook, XFStyle

from common.mixins import MultiEditMixin
from common.views import CsrfExemptSessionAuthentication

from .models import Flowcell, Lane, Sequencer, SequencingProvider
from .serializers import (
    FlowcellListSerializer,
    FlowcellSerializer,
    LaneSerializer,
    PoolInfoSerializer,
    PoolListSerializer,
    SequencerSerializer,
    SequencingProviderSerializer,
)

ReadLength = apps.get_model("library_sample_shared", "ReadLength")
IndexI7 = apps.get_model("library_sample_shared", "IndexI7")
IndexI5 = apps.get_model("library_sample_shared", "IndexI5")
Library = apps.get_model("library", "Library")
Sample = apps.get_model("sample", "Sample")
Pool = apps.get_model("index_generator", "Pool")

logger = logging.getLogger("db")


# def indices_present(libraries, samples):
#     count_total = libraries.count() + samples.count()
#     index_i7_count = 0
#     index_i5_count = 0
#     equal_representation_count = 0

#     for library in libraries:
#         if library.index_i7 != '':
#             index_i7_count += 1
#         if library.index_i5 != '':
#             index_i5_count += 1
#         if library.equal_representation_nucleotides:
#             equal_representation_count += 1

#     for sample in samples:
#         if sample.index_i7 != '':
#             index_i7_count += 1
#         if sample.index_i5 != '':
#             index_i5_count += 1
#         if sample.equal_representation_nucleotides:
#             equal_representation_count += 1

#     # If at least one Index I7/I5 is set
#     index_i7_show = 'Yes' if index_i7_count > 0 else 'No'
#     index_i5_show = 'Yes' if index_i5_count > 0 else 'No'

#     # If all Equal Representation are set
#     equal_representation = 'Yes' \
#         if equal_representation_count == count_total else 'No'

#     return index_i7_show, index_i5_show, equal_representation


class SequencerViewSet(viewsets.ReadOnlyModelViewSet):
    """Get the list of sequencers."""

    queryset = Sequencer.objects.all().filter(archived=False)
    serializer_class = SequencerSerializer


class PoolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pool.objects.all().filter(archived=False)
    serializer_class = PoolInfoSerializer
    permission_classes = [IsAdminUser]

    def retrieve(self, request, pk=None):
        """Get libraries and samples for a pool with a given id."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data["records"])


class FlowcellViewSet(MultiEditMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = LaneSerializer

    def get_queryset(self):
        libraries_qs = (
            Library.objects.filter(~Q(status=-1))
            .prefetch_related("read_length", "index_type")
            .only("read_length", "index_type", "equal_representation_nucleotides")
        )

        samples_qs = (
            Sample.objects.filter(~Q(status=-1))
            .prefetch_related("read_length", "index_type")
            .only("read_length", "index_type", "equal_representation_nucleotides")
        )

        lanes_qs = (
            Lane.objects.filter(completed=False)
            .prefetch_related(
                "pool",
                Prefetch("pool__libraries", queryset=libraries_qs),
                Prefetch("pool__samples", queryset=samples_qs),
            )
            .order_by("name")
        )

        queryset = (
            Flowcell.objects.select_related(
                "pool_size",
            )
            .filter(archived=False)
            .prefetch_related(
                Prefetch("lanes", queryset=lanes_qs),
            )
            .order_by("-create_time")
        )

        return queryset

    def list(self, request, *args, **kwargs):
        today = timezone.datetime.today()

        default_start_date = today - relativedelta(months=0)
        default_end_date = today

        start_date_param = request.query_params.get(
            "start", default_start_date.strftime("%Y-%m")
        )
        end_date_param = request.query_params.get(
            "end", default_end_date.strftime("%Y-%m")
        )

        start_date = timezone.datetime.strptime(start_date_param, "%Y-%m")
        end_date = timezone.datetime.strptime(end_date_param, "%Y-%m")

        start_date = start_date.replace(day=1)
        end_date = end_date.replace(day=1) + relativedelta(months=1, seconds=-1)

        queryset = self.get_queryset().filter(
            create_time__gte=start_date, create_time__lte=end_date
        )

        serializer = FlowcellListSerializer(queryset, many=True)
        data = list(itertools.chain(*serializer.data))
        return Response(data)

    def create(self, request):
        """Add a flowcell."""

        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            post_data = request.data.get("data", [])
            if isinstance(post_data, str):
                post_data = json.loads(post_data)
        else:
            post_data = json.loads(request.data.get("data", "[]"))

        if not post_data:
            return Response(
                {
                    "success": False,
                    "message": "Invalid payload.",
                },
                400,
            )

        serializer = FlowcellSerializer(data=post_data)
        if serializer.is_valid():
            flowcell = serializer.save()
            flowcell.requests.filter(invoice_date__isnull=True).distinct().update(
                invoice_date=flowcell.create_time
            )
            return Response({"success": True}, 201)

        else:
            return Response(
                {
                    "success": False,
                    "message": "Invalid payload.",
                    "errors": serializer.errors,
                },
                400,
            )

    @action(methods=["get"], detail=False)
    def pool_list(self, request):
        data = []

        # Libraries which have reached the Pooling step
        libraries_qs = (
            Library.objects.filter(status__gte=2)
            .prefetch_related("read_length")
            .only("status", "read_length")
        )

        # Samples which have reached the Pooling step
        samples_qs = (
            Sample.objects.filter(status__gte=3)
            .prefetch_related("read_length")
            .only("status", "read_length")
        )

        queryset = (
            Pool.objects.prefetch_related(
                "size",
                Prefetch("libraries", queryset=libraries_qs),
                Prefetch("samples", queryset=samples_qs),
            )
            .filter(archived=False, is_loaded=False)
            .order_by("pk")
        )

        serializer = PoolListSerializer(queryset, many=True)
        data = [x for x in serializer.data if x != {}]
        data = sorted(data, key=lambda x: x["ready"], reverse=True)

        return Response(data)

    @action(
        methods=["post"],
        detail=False,
        authentication_classes=[CsrfExemptSessionAuthentication],
    )
    def download_benchtop_protocol(self, request):
        """Generate Benchtop Protocol as XLS file for selected lanes."""
        ids = json.loads(request.data.get("ids", "[]"))

        filename = "FC_Loading_Benchtop_Protocol.xls"
        response = HttpResponse(content_type="application/ms-excel")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        queryset = (
            self.filter_queryset(self.get_queryset())
            .filter(lanes__pk__in=ids)
            .distinct()
        )

        serializer = FlowcellListSerializer(queryset, many=True)
        data = list(itertools.chain(*serializer.data))

        font_style = XFStyle()
        font_style.alignment.wrap = 1
        font_style_bold = XFStyle()
        font_style_bold.font.bold = True

        wb = Workbook(encoding="utf-8")
        ws = wb.add_sheet("FC_Loading_Benchtop_Protocol")

        header = [
            "Pool ID",
            "Flowcell ID",
            "Sequencer",
            "Lane",
            "Request",
            "I7 present",
            "I5 present",
            #'Equal Representation of Nucleotides',
            "Library protocol",
            "Read Length",
            "Loading Concentration",
            "PhiX %",
        ]

        row_num = 0

        for i, column in enumerate(header):
            ws.write(row_num, i, column, font_style_bold)
            ws.col(i).width = 8000

        for item in data:
            row_num += 1

            row = [
                item["pool_name"],
                item["flowcell_id"],
                item["sequencer_name"],
                item["name"],
                item["request"],
                item["index_i7_show"],
                item["index_i5_show"],
                # item['equal_representation'],
                item["protocol"],
                item["read_length_name"],
                item["loading_concentration"],
                item["phix"],
            ]

            for i in range(len(row)):
                ws.write(row_num, i, row[i], font_style)

        wb.save(response)

        return response

    @action(
        methods=["post"],
        detail=False,
        authentication_classes=[CsrfExemptSessionAuthentication],
    )
    def download_sample_sheet(self, request):
        """Generate an Illumina v2 sample sheet for selected lanes."""

        def generate_illuminav2_sample_sheet(writer, sample_sheet, records):
            """Generate an Illumina v2 sample sheet for a given lane."""

            # Header
            writer.writerow(["[Header]"] + [""] * 2)
            writer.writerow(["FileFormatVersion", "2"] + [""])
            writer.writerow(
                ["RunName", sample_sheet.get("Header", {}).get("RunName", "")] + [""]
            )
            writer.writerow(
                [
                    "InstrumentPlatform",
                    sample_sheet.get("Header", {}).get("InstrumentPlatform", ""),
                ]
                + [""]
            )
            writer.writerow(
                [
                    "InstrumentType",
                    sample_sheet.get("Header", {}).get("InstrumentType", ""),
                ]
                + [""]
            )
            writer.writerow([""] * 3)

            if "Reads" in sample_sheet:
                # Reads
                writer.writerow(["[Reads]"] + [""] * 2)
                for k, v in sample_sheet["Reads"].items():
                    writer.writerow([k, v] + [""])
                writer.writerow([""] * 3)

            # Sequencing settings
            if "Sequencing_Settings" in sample_sheet:
                writer.writerow(["[Sequencing_Settings]"] + [""] * 2)
                for k, v in sample_sheet["Sequencing_Settings"].items():
                    writer.writerow([k, v] + [""])
                writer.writerow([""] * 3)

            # BCLconvert settings
            writer.writerow(["[BCLConvert_Settings]"] + [""] * 2)

            bclconvert_settings = sample_sheet.get(
                "BCLConvert_Settings",
                {},
            )

            # Write BCLconvert settings in a specific order, followed by any additional settings
            key_order = [
                "SoftwareVersion",
                "FastqCompressionFormat",
                "BarcodeMismatchesIndex1",
                "BarcodeMismatchesIndex2",
            ]
            for k in key_order:
                if k in bclconvert_settings:
                    writer.writerow([k, bclconvert_settings.get(k, "")] + [""])
            for k, v in bclconvert_settings.items():
                if k not in key_order:
                    writer.writerow([k, v] + [""])

            writer.writerow([""] * 3)

            # BCLconvert data
            writer.writerow(["[BCLConvert_Data]"] + [""] * 2)
            writer.writerow(["Sample_ID", "Index", "Index2"])

            rows = [
                [record.name, record.index_i7, record.index_i5] for record in records
            ]

            for row in sorted(rows, key=lambda item: item[0]):
                writer.writerow(row)

            writer.writerow([""] * 3)

        # try:
        flowcell_id = request.data.get("flowcell_id", "")
        flowcell = Flowcell.objects.get(pk=flowcell_id)
        sample_sheet = flowcell.sample_sheet or {}
        lane_ids = json.loads(request.data.get("ids", "[]"))

        sample_sheet_type = sample_sheet.get("sample_sheet_type", "illuminav2")
        if sample_sheet_type != "illuminav2":
            raise Exception("Unknown sample sheet type")

        if not lane_ids:
            raise Exception("No lanes selected.")

        # Get all samples and libraries for the selected lanes
        lanes = flowcell.lanes.filter(pk__in=lane_ids)
        records = list(
            itertools.chain.from_iterable(
                itertools.chain(
                    lane.pool.libraries.all()
                    .filter(~Q(status=-1))
                    .only("name", "index_i7", "index_i5"),
                    lane.pool.samples.all()
                    .filter(~Q(status=-1))
                    .only("name", "index_i7", "index_i5"),
                )
                for lane in lanes
            )
        )

        response = HttpResponse(content_type="text/csv")
        writer = csv.writer(response)

        if sample_sheet_type == "illuminav2":
            run_name = sample_sheet.get("Header", {}).get("RunName", "norunname")
            generate_illuminav2_sample_sheet(writer, sample_sheet, records)
        else:
            raise Exception("Unknown sample sheet type")

        # Clean the quote_ids to remove spaces and special characters for the filename
        quote_ids_clean = "_".join(
            re.sub(r"\s+", "", quote_id)
            for quote_id in flowcell.sequencing_quotes.all().values_list(
                "quote_id", flat=True
            )
        )
        f_name = f"{flowcell.flowcell_id or quote_ids_clean}_{run_name}_SampleSheet.csv"
        response["Content-Disposition"] = f'attachment; filename="{f_name}"'

        return response

        # except Exception as e:
        #     return Response(
        #         {
        #             "success": False,
        #             "message": "There was an error creating the sample sheet. "
        #             f"Error: {e}",
        #         },
        #         400,
        #     )

    @action(methods=["get"], detail=False)
    def retrieve_samplesheet(self, request):
        """Download SampleSheet for all lanes of a flowcell."""
        flowcell_id = request.query_params.get("flowcell_id", "")
        flowcell = get_object_or_404(Flowcell, flowcell_id=flowcell_id)
        lane_pks_list = list(flowcell.lanes.all().values_list("pk", flat=True))
        post_request = type("MockRequest", (), {})()
        post_request.data = {
            "ids": json.dumps(lane_pks_list),
            "flowcell_id": flowcell.pk,
        }
        return self.download_sample_sheet(post_request)


class FlowcellAnalysisViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(methods=["get"], detail=False)
    def analysis_list(self, request):
        """
        This returns a dictionary of the information required to run an automated
        analysis on the flow cell's contents
        The keys of the dictionary are projects. The values are then a dictionary
        dictionaries with library name keys and tuple values of (sample/library
        name, library type, library protocol type, organism).
        """
        flowcell_id = request.query_params.get("flowcell_id", "")
        flowcell = get_object_or_404(Flowcell, flowcell_id=flowcell_id)

        # Iterate over requests
        requests = dict()
        for request in flowcell.requests.all():
            rname = request.name
            requests[rname] = requests.get(rname, dict())
            records = list(
                itertools.chain(request.libraries.all(), request.samples.all())
            )
            for item in records:
                #               quick fix to deal with undefined index_type
                #               this can happen for failed samples
                if item.index_type is not None:
                    ind_type = item.index_type.name
                else:
                    ind_type = "NA"

                requests[rname][item.barcode] = [
                    item.name,
                    item.library_type.name,
                    item.library_protocol.name,
                    [
                        item.organism.name,
                        item.organism.label,
                        item.organism.yaml,
                    ],
                    ind_type,
                    item.sequencing_depth,
                ]

        return Response(requests)


class SequencingProviderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = SequencingProvider.objects.all().filter(archived=False)
    serializer_class = SequencingProviderSerializer
