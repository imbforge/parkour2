import copy
import itertools

from django.apps import apps
from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import ValidationError
from rest_framework.serializers import (
    CharField,
    IntegerField,
    JSONField,
    ListField,
    ListSerializer,
    ModelSerializer,
    SerializerMethodField,
)

from common.utils import merge_dicts

from .models import Flowcell, Lane, Sequencer, SequencingProvider, SequencingQuote

Request = apps.get_model("request", "Request")
Library = apps.get_model("library", "Library")
Sample = apps.get_model("sample", "Sample")
Pool = apps.get_model("index_generator", "Pool")


class SequencerSerializer(ModelSerializer):
    class Meta:
        model = Sequencer
        fields = (
            "id",
            "name",
        )


class LaneListSerializer(ListSerializer):
    def update(self, instance, validated_data):
        # Maps for id->instance and id->data item.
        object_mapping = {obj.pk: obj for obj in instance}
        data_mapping = {item["pk"]: item for item in validated_data}

        # Perform updates
        ret = []
        for obj_id, data in data_mapping.items():
            obj = object_mapping.get(obj_id, None)
            if obj is not None:
                if (
                    "quality_check" in data.keys()
                    and data["quality_check"] == "completed"
                ):
                    obj.completed = True
                ret.append(self.child.update(obj, data))
        return ret


class LaneSerializer(ModelSerializer):
    pk = IntegerField()
    pool_name = SerializerMethodField()
    read_length_name = SerializerMethodField()
    index_i7_show = SerializerMethodField()
    index_i5_show = SerializerMethodField()
    equal_representation = SerializerMethodField()
    quality_check = CharField(required=False)
    request = SerializerMethodField()
    protocol = SerializerMethodField()

    class Meta:
        list_serializer_class = LaneListSerializer
        model = Lane
        fields = (
            "pk",
            "name",
            "pool",
            "pool_name",
            "read_length_name",
            "index_i7_show",
            "index_i5_show",
            "equal_representation",
            "loading_concentration",
            "phix",
            "quality_check",
            "request",
            "protocol",
        )
        extra_kwargs = {
            "name": {"required": False},
            "pool": {"required": False},
        }

    def get_request(self, obj):
        requests = []
        records = obj.pool.libraries.all() or obj.pool.samples.all()

        for record in records:
            for req in record.request.all():
                requests.append(req.name)
        if len(requests) == 1 or len(set(requests)) == 1:
            return requests[0]
        else:
            return ";".join(requests)

    def get_protocol(self, obj):
        protocols = []

        records = obj.pool.libraries.all() or obj.pool.samples.all()

        for record in records:
            if record.library_protocol:
                protocols.append(record.library_protocol.name)
            else:
                protocols.append(None)

        if len(protocols) == 1 or len(set(protocols)) == 1:
            return protocols[0]
        else:
            return ";".join(protocols)

    def get_pool_name(self, obj):
        return obj.pool.name

    def get_read_length_name(self, obj):
        read_lengths = []
        i = 0
        records = obj.pool.libraries.all() or obj.pool.samples.all()
        for record in records:
            # print(record.library_protocol.name)
            read_lengths.append(str(record.read_length.name))

        if len(read_lengths) == 1 or len(set(read_lengths)) == 1:
            return read_lengths[0]
        else:
            return ";".join(read_lengths)

    def get_index_i7_show(self, obj):
        """we show the actual index instead of a yes/no entry"""
        records = obj.pool.libraries.all() or obj.pool.samples.all()
        idx = []
        contains_i7 = False
        for record in records:
            if str(record.index_i7) != "":
                contains_i7 = True
                break
                # idx.append(str(record.index_i7))

        # if len(idx) == 1 or len(set(idx)) == 1:
        #    return idx[0]
        # else:
        #    return ";".join(idx)
        if contains_i7:
            return "Yes"
        else:
            return ""

    def get_index_i5_show(self, obj):
        """we show the actual index instead of a yes/no entry"""

        records = obj.pool.libraries.all() or obj.pool.samples.all()
        idx = []
        contains_i5 = False
        for record in records:
            if str(record.index_i5) != "":
                contains_i5 = True
                break
                # idx.append(str(record.index_i5))

        # if len(idx) == 1 or len(set(idx)) == 1:
        #    return idx[0]
        # else:
        #    return ";".join(idx)
        if contains_i5:
            return "Yes"
        else:
            return ""
        # return None

    def get_equal_representation(self, obj):
        records = list(
            itertools.chain(obj.pool.libraries.all(), obj.pool.samples.all())
        )
        ern = [x.equal_representation_nucleotides for x in records].count(True)
        return len(records) == ern


class FlowcellListSerializer(ModelSerializer):
    flowcell = SerializerMethodField()
    sequencer = SerializerMethodField()
    sequencer_name = SerializerMethodField()
    pool_size_name = SerializerMethodField()
    sequencing_provider_name = SerializerMethodField()
    quote_ids = SerializerMethodField()
    lanes = LaneSerializer(many=True)

    class Meta:
        model = Flowcell
        fields = (
            "flowcell",
            "flowcell_id",
            "sequencing_provider_name",
            "quote_ids",
            "sequencer",
            "sequencer_name",
            "pool_size_name",
            "create_time",
            "lanes",
            "sample_sheet",
        )

    def get_flowcell(self, obj):
        # pprint(vars(obj))
        return obj.pk

    def get_sequencer(self, obj):
        return obj.pool_size.sequencer.id

    def get_sequencer_name(self, obj):
        return str(obj.pool_size.sequencer)

    def get_pool_size_name(self, obj):
        return str(obj.pool_size)

    def get_sequencing_provider_name(self, obj):
        names = list(
            dict.fromkeys(
                obj.sequencing_quotes.exclude(
                    sequencing_provider__isnull=True
                ).values_list("sequencing_provider__name", flat=True)
            )
        )
        if not names:
            return None
        return "; ".join(filter(None, names))

    def get_quote_ids(self, obj):
        return list(obj.sequencing_quotes.values_list("quote_id", flat=True))

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if not any(data["lanes"]):
            return []

        return list(
            map(
                lambda x: {
                    "flowcell": data["flowcell"],
                    "flowcell_id": data["flowcell_id"],
                    "sequencer": data["sequencer"],
                    "pool_size_name": data["pool_size_name"],
                    "sequencer_name": data["sequencer_name"],
                    "create_time": data["create_time"],
                    "sequencing_provider_name": data["sequencing_provider_name"],
                    "quote_ids": data["quote_ids"],
                    **x,
                },
                data.pop("lanes"),
            )
        )


class FlowcellSerializer(ModelSerializer):
    quotes = ListField(
        child=JSONField(), required=False, allow_empty=True, write_only=True
    )

    class Meta:
        model = Flowcell
        fields = (
            "flowcell_id",
            "pool_size",
            "sample_sheet",
            "quotes",
        )

    def validate(self, attrs):
        # Validate the quotes payload and normalize the date_created field
        # The frontend sends a single quote payload while the model stores the
        # relationship on `sequencing_quotes` as a ManyToMany. The M2M objects do
        # not exist before the Flowcell is saved, so we must skip the model-level
        # `clean()` requirement when a quote payload is present.
        quotes = attrs.get("quotes", [])
        if not isinstance(quotes, list):
            quotes = [quotes] if quotes else []

        # Gather all provider IDs to fetch in a single database query
        provider_ids = [
            q.get("sequencing_provider")
            for q in quotes
            if isinstance(q, dict) and q.get("sequencing_provider")
        ]

        # Check if all provided provider IDs exist in the database
        existing_provider_ids = set(
            SequencingProvider.objects.filter(pk__in=provider_ids).values_list(
                "pk", flat=True
            )
        )

        validated_quotes = []
        for index, quote in enumerate(quotes):
            if not quote or not isinstance(quote, dict):
                continue

            provider_id = quote.get("sequencing_provider")
            if not provider_id:
                raise ValidationError(
                    {
                        "quotes": f"Quote at index {index}: Sequencing provider must be provided."
                    }
                )

            if provider_id not in existing_provider_ids:
                raise ValidationError(
                    {
                        "quotes": f"Quote at index {index}: Sequencing provider with ID {provider_id} does not exist."
                    }
                )

            # Parse date in validate so create() receives clean date objects
            created_date = quote.get("date_created", "")
            if isinstance(created_date, str) and created_date.strip():
                parsed_dt = parse_datetime(created_date.strip())
                quote["date_created"] = parsed_dt.date() if parsed_dt else None

            validated_quotes.append(quote)

        # Write normalized quotes back to attrs
        attrs["quotes"] = validated_quotes

        model_attrs = {
            key: value for key, value in attrs.items() if key not in {"lanes", "quotes"}
        }
        # If quotes are provided, we skip the model-level clean() validation that requires either
        # flowcell_id or sequencing_quotes
        if attrs.get("quotes") and not model_attrs.get("flowcell_id"):
            return attrs

        flowcell = Flowcell(**model_attrs)
        flowcell.clean()

        return attrs

    def to_internal_value(self, data):
        data = data.copy()

        # Normalize the incoming quotes to a list of quote objects
        quotes = data.get("quotes")

        if quotes is not None and not isinstance(quotes, list):
            data["quotes"] = [quotes]

        internal_value = super().to_internal_value(data)

        lanes = data.get("lanes", [])
        if not lanes:
            raise ValidationError(
                {
                    "lanes": ["No lanes are provided."],
                }
            )

        internal_value.update({"lanes": lanes})

        return internal_value

    @transaction.atomic
    def create(self, validated_data):
        lanes = validated_data.pop("lanes")
        quotes = validated_data.pop("quotes", [])
        sample_sheet = validated_data.get("sample_sheet", {})

        # Create flowcell
        instance = super().create(validated_data)

        # Create Lane objects and add them to the flowcell.
        # Use .create() rather than bulk_create() so Lane.save() runs and updates
        # the parent pool's loaded counter; bulk_create bypasses that signal.
        created_lanes = [
            Lane.objects.create(name=lane["name"], pool_id=lane["pool_id"])
            for lane in lanes
        ]
        instance.lanes.add(*created_lanes)

        # Update the loaded counter for each pool and mark all libraries/samples
        # in the pool as loaded (status=5)
        pool_ids = {lane.pool_id for lane in created_lanes}
        pools = Pool.objects.filter(archived=False, pk__in=pool_ids)
        for pool in pools:
            Pool.objects.filter(pk=pool.pk).update(
                # Set loaded to the number of lanes in the pool,
                # and mark the pool as loaded
                is_loaded=True,
                loaded=pool.lane_set.count(),
            )
            pool.libraries.all().filter(status=4).update(status=5)
            pool.samples.all().filter(status=4).update(status=5)

        # When a Flowcell is loaded, update all requests that have libraries or
        # samples in the flowcell's pools to be marked as sequenced
        libraries = Library.objects.filter(pool__in=pools)
        samples = Sample.objects.filter(pool__in=pools)
        requests = Request.objects.filter(
            archived=False,
            pk__in=set(
                itertools.chain(
                    libraries.values_list("request", flat=True).distinct(),
                    samples.values_list("request", flat=True).distinct(),
                )
            ),
        )
        requests.update(sequenced=True)
        instance.requests.add(*requests)

        # Create SequencingQuote objects and add them to the flowcell
        quote_objs = []
        for quote in quotes:
            provider_id = quote.pop("sequencing_provider")

            quote_obj = SequencingQuote(
                sequencing_provider_id=provider_id
                if not isinstance(provider_id, SequencingProvider)
                else provider_id.pk,
                **quote,
            )
            quote_obj.clean()
            quote_obj.save()
            quote_objs.append(quote_obj)

        if quote_objs:
            instance.sequencing_quotes.add(*quote_objs)

        # Create sample sheet based on the sequencer's schema if it exists
        sequencer = getattr(instance.pool_size, "sequencer", None)
        if sequencer and sequencer.sample_sheet_schema:
            schema_default = copy.deepcopy(sequencer.sample_sheet_schema.schema)
            sample_sheet = merge_dicts(schema_default, sample_sheet)
        instance.sample_sheet = sample_sheet
        instance.save(update_fields=["sample_sheet"])

        return instance


class PoolListSerializer(ModelSerializer):
    read_length = SerializerMethodField()
    read_length_name = SerializerMethodField()
    pool_size_id = SerializerMethodField()
    pool_size = SerializerMethodField()
    ready = SerializerMethodField()

    class Meta:
        model = Pool
        fields = (
            "pk",
            "name",
            "read_length",
            "read_length_name",
            "pool_size_id",
            "pool_size",
            "loaded",
            "ready",
        )

    def get_read_length(self, obj):
        records = obj.libraries.all() or obj.samples.all()
        if records.count() > 0:
            return records[0].read_length.pk
        return None

    def get_read_length_name(self, obj):
        records = obj.libraries.all() or obj.samples.all()
        if records.count() > 0:
            return records[0].read_length.name
        return None

    def get_pool_size_id(self, obj):
        return obj.size.pk

    def get_pool_size(self, obj):
        return obj.size.lanes

    def get_ready(self, obj):
        libraries_statuses = [x.status for x in obj.libraries.all()]
        samples_statuses = [x.status for x in obj.samples.all()]
        statuses = list(libraries_statuses) + list(samples_statuses)
        return statuses.count(4) == len(statuses)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ignore pools if all of its libraries/samples are
        # not ready yet or failed
        if instance.libraries.count() + instance.samples.count() == 0:
            return {}
        return data


class PoolInfoBaseSerializer(ModelSerializer):
    record_type = SerializerMethodField()
    protocol_name = SerializerMethodField()
    request_name = SerializerMethodField()
    request_pk = SerializerMethodField()

    class Meta:
        fields = (
            "name",
            "barcode",
            "record_type",
            "protocol_name",
            "request_name",
            "request_pk",
        )

    def get_record_type(self, obj):
        return obj.__class__.__name__

    def get_protocol_name(self, obj):
        return obj.library_protocol.name

    def get_request_name(self, obj):
        return obj.request.get().name

    def get_request_pk(self, obj):
        return obj.request.get().pk


class PoolInfoLibrarySerializer(PoolInfoBaseSerializer):
    class Meta(PoolInfoBaseSerializer.Meta):
        model = Library
        fields = PoolInfoBaseSerializer.Meta.fields


class PoolInfoSampleSerializer(PoolInfoBaseSerializer):
    class Meta(PoolInfoBaseSerializer.Meta):
        model = Sample
        fields = PoolInfoBaseSerializer.Meta.fields + ("is_converted",)


class PoolInfoSerializer(ModelSerializer):
    libraries = SerializerMethodField()
    samples = SerializerMethodField()

    class Meta:
        model = Pool
        fields = (
            "id",
            "name",
            "libraries",
            "samples",
        )

    def get_libraries(self, obj):
        queryset = obj.libraries.filter(~Q(status=-1))
        serializer = PoolInfoLibrarySerializer(queryset, many=True)
        return serializer.data

    def get_samples(self, obj):
        queryset = obj.samples.filter(~Q(status=-1))
        serializer = PoolInfoSampleSerializer(queryset, many=True)
        return serializer.data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        libraries = data.pop("libraries")
        samples = data.pop("samples")
        records = libraries + samples

        data.update({"records": sorted(records, key=lambda x: x["barcode"][3:])})

        return data


class SequencingProviderSerializer(ModelSerializer):
    class Meta:
        model = SequencingProvider
        fields = (
            "id",
            "name",
            "archived",
        )
