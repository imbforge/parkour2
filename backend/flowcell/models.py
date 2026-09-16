from django.core.exceptions import ValidationError
from django.db import models

from common.models import DateTimeMixin
from index_generator.models import Pool
from request.models import Request


class Sequencer(models.Model):
    name = models.CharField("Name", max_length=50)
    archived = models.BooleanField("Archived", default=False)

    instrument_platform = models.CharField(
        "instrument platform", help_text="For samplesheet", max_length=50
    )
    instrument_type = models.CharField(
        "instrument type", help_text="For samplesheet", max_length=50
    )
    bclconvert_version = models.CharField(
        "BCLconvert version", help_text="For samplesheet", max_length=50
    )

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


class Flowcell(DateTimeMixin):
    flowcell_id = models.CharField("Flowcell ID", max_length=50, blank=True)
    pool_size = models.ForeignKey(
        "index_generator.PoolSize",
        verbose_name="Pool Size",
        on_delete=models.SET_NULL,
        null=True,
    )
    sequencing_provider = models.ForeignKey(
        SequencingProvider,
        verbose_name="Sequencing Provider",
        on_delete=models.SET_NULL,
        null=True,
        blank=False,
    )
    sequencing_provider_quote_id = models.CharField(
        "Sequencing Provider Quote ID", max_length=100, blank=True
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

        if self.sequencing_provider is None:
            return

        if self.sequencing_provider.name.strip().lower() == "internal":
            if not self.flowcell_id:
                raise ValidationError(
                    {
                        "flowcell_id": [
                            "This field is required when the sequencing provider is 'Internal'."
                        ]
                    }
                )
            return

        self.flowcell_id = self.flowcell_id.strip() if self.flowcell_id else ""

        if not self.sequencing_provider_quote_id.strip():
            raise ValidationError(
                {
                    "sequencing_provider_quote_id": [
                        "This field is required when the sequencing provider is not 'Internal'."
                    ]
                }
            )

        self.sequencing_provider_quote_id = self.sequencing_provider_quote_id.strip()

    def __str__(self):
        return (
            self.flowcell_id
            or f"{self.sequencing_provider.name} - {self.sequencing_provider_quote_id}"
        )
