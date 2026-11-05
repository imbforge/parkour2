from django.core.exceptions import ValidationError
from django.db import models

from common.models import DateTimeMixin
from index_generator.models import Pool
from request.models import Request


class SampleSheetSchema(models.Model):
    name = models.CharField("Version", max_length=50, unique=True)
    schema = models.JSONField("Default schema", blank=True, null=True, default=dict)
    archived = models.BooleanField("Archived", default=False)

    def clean(self):
        super().clean()

        # Clean fields to remove leading/trailing whitespace
        self.name = self.name.strip() if self.name else ""

    def __str__(self):
        return self.name


class Sequencer(models.Model):
    name = models.CharField("Name", max_length=50)
    archived = models.BooleanField("Archived", default=False)

    sample_sheet_schema = models.ForeignKey(
        SampleSheetSchema,
        verbose_name="sample sheet schema",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    def clean(self):
        super().clean()

        # Clean fields to remove leading/trailing whitespace
        self.name = self.name.strip() if self.name else ""

    def __str__(self):
        return self.name


class Lane(models.Model):
    name = models.CharField("Name", max_length=6)
    pool = models.ForeignKey(
        Pool, verbose_name="Pool", on_delete=models.SET_NULL, null=True
    )
    loading_concentration = models.FloatField(
        "Loading Concentration", blank=True, null=True
    )
    phix = models.FloatField("PhiX %", blank=True, null=True)
    completed = models.BooleanField("Completed", default=False)

    def __str__(self):
        return f"{self.name}: {self.pool.name}"

    def save(self, *args, **kwargs):
        created = self.pk is None
        super().save(*args, **kwargs)

        # When a Lane objects is created, increment the loaded value of the
        # related pool
        if created:
            self.pool.loaded += 1
            self.pool.save(update_fields=["loaded"])


class SequencingProvider(models.Model):
    name = models.CharField("Name", max_length=100)
    archived = models.BooleanField("Archived", default=False)

    def __str__(self):
        return self.name


class SequencingQuote(models.Model):
    sequencing_provider = models.ForeignKey(
        SequencingProvider,
        verbose_name="Sequencing Provider",
        on_delete=models.SET_NULL,
        null=True,
        blank=False,
    )
    quote_id = models.CharField("quote ID", max_length=200, blank=False)
    date_created = models.DateField("date", blank=False)
    data_delivery_method = models.CharField(
        "data delivery method", max_length=200, blank=False
    )
    price = models.DecimalField(
        max_digits=8, decimal_places=2, blank=False, null=True, default=None
    )
    notes = models.TextField("notes", blank=True)

    class Meta:
        unique_together = ("sequencing_provider", "quote_id")

    def __str__(self):
        return f"{self.sequencing_provider.name} - {self.quote_id}"

    def clean(self):
        super().clean()

        # Clean fields to remove leading/trailing whitespace
        for field in [
            "quote_id",
            "data_delivery_method",
        ]:
            value = getattr(self, field) or ""
            if value:
                setattr(self, field, value.strip())


class Flowcell(DateTimeMixin):
    flowcell_id = models.CharField("Flowcell ID", max_length=50, blank=True)
    sequencing_quotes = models.ManyToManyField(
        SequencingQuote,
        verbose_name="Sequencing Quotes",
        related_name="flowcells",
        blank=True,
    )
    pool_size = models.ForeignKey(
        "index_generator.PoolSize",
        verbose_name="Pool Size",
        on_delete=models.SET_NULL,
        null=True,
    )
    lanes = models.ManyToManyField(Lane, related_name="flowcell", blank=True)
    requests = models.ManyToManyField(Request, related_name="flowcell", blank=True)
    matrix = models.JSONField("Flowcell Matrix", blank=True, null=True)
    sequences = models.JSONField("Sequences", blank=True, null=True)
    sample_sheet = models.JSONField("sample sheet", blank=True, null=True)
    archived = models.BooleanField("Archived", default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["flowcell_id"],
                condition=~models.Q(flowcell_id=""),
                name="unique_flowcell_id_non_empty",
                violation_error_message="Flowcell ID must be unique when provided.",
            )
        ]

    def clean(self):
        super().clean()

        self.flowcell_id = self.flowcell_id.strip() if self.flowcell_id else ""

        # Ensure that either flowcell_id or sequencing_quotes is provided.
        # Guard against unsaved instances, because calling self.sequencing_quotes.exists()
        # on an unsaved model can recurse through __str__ while Django is formatting
        # the related manager for an error message.
        has_quotes = self.pk is not None and self.sequencing_quotes.exists()

        if not self.flowcell_id and not has_quotes:
            raise ValidationError(
                {
                    "flowcell_id": [
                        "Either a Flowcell ID or a sequencing quote must be provided."
                    ],
                    "sequencing_quotes": [
                        "Either a Flowcell ID or a sequencing quote must be provided."
                    ],
                }
            )

    def __str__(self):
        if self.pk is None:
            return self.flowcell_id or "Unsaved Flowcell"

        quote_ids = list(self.sequencing_quotes.values_list("quote_id", flat=True))
        quote_display = ", ".join(quote_ids)

        if self.flowcell_id:
            return self.flowcell_id

        quote_provider = (
            self.sequencing_quotes.filter(sequencing_provider__isnull=False)
            .select_related("sequencing_provider")
            .first()
        )
        if quote_provider and quote_provider.sequencing_provider:
            return f"{quote_provider.sequencing_provider.name} - {quote_display}"
        return quote_display
