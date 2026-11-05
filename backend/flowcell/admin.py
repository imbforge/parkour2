from django import forms
from django.contrib import admin
from django.templatetags.static import static
from django.urls import reverse
from django.utils.safestring import mark_safe

from common.admin import ArchivedFilter
from flowcell.models import (
    Flowcell,
    Lane,
    SampleSheetSchema,
    Sequencer,
    SequencingProvider,
    SequencingQuote,
)
from index_generator.models import PoolSize


class LaneInline(admin.TabularInline):
    model = Flowcell.lanes.through
    verbose_name = "Lane"
    verbose_name_plural = "Lanes"
    # readonly_fields = ('lane',)
    can_delete = False
    extra = 0

    fields = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
        "edit_link",
    )
    readonly_fields = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
        "edit_link",
    )

    @admin.display(description="Name")
    def name(self, instance):
        return instance.lane.name

    @admin.display(description="Pool")
    def pool(self, instance):
        return instance.lane.pool.name

    @admin.display(description="Loading Concentration")
    def loading_concentration(self, instance):
        return instance.lane.loading_concentration

    @admin.display(description="PhiX %")
    def phix(self, instance):
        return instance.lane.phix

    @admin.display(
        description="Completed",
        boolean=True,
    )
    def completed(self, instance):
        return instance.lane.completed

    @admin.display(description="")
    def edit_link(self, instance):
        lane = instance.lane
        url = (
            reverse(
                f"admin:{lane._meta.app_label}_{lane._meta.model_name}_change",
                args=[lane.id],
            )
            + "?_to_field=id&_popup=1"
        )
        icon_changelink_url = static("admin/img/icon-changelink.svg")
        return mark_safe(
            f'<a id="lane-{lane.id}" class="related-widget-wrapper-link '
            f'add-related" data-popup="yes" href="{url}"><img src='
            f'{icon_changelink_url} alt="Change"></a>'
        )

    def has_add_permission(self, request, obj=None):
        return False


class PoolSizeInline(admin.TabularInline):
    model = PoolSize
    fields = (
        "short_name",
        "lanes",
        "size",
        "cycles",
        "read_lengths",
        "archived",
    )
    ordering = (
        "lanes",
        "size",
        "cycles",
    )
    autocomplete_fields = ("read_lengths",)
    extra = 1
    verbose_name = "Sequencing kit"  # PoolSize as Sequencing kit
    verbose_name_plural = "Sequencing kits"


@admin.register(Sequencer)
class SequencerAdmin(admin.ModelAdmin):
    list_display = ("name", "sample_sheet_schema", "archived")

    list_filter = (ArchivedFilter,)

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )
    inlines = [PoolSizeInline]

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)


class FlowcellAdminForm(forms.ModelForm):
    class Meta:
        model = Flowcell
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        flowcell_id = cleaned_data.get("flowcell_id")
        quotes = cleaned_data.get("sequencing_quotes")

        if not flowcell_id and not quotes:
            self.add_error(
                "flowcell_id",
                "Either a Flowcell ID or a sequencing quote must be provided.",
            )
            self.add_error(
                "sequencing_quotes",
                "Either a Flowcell ID or a sequencing quote must be provided.",
            )

        return cleaned_data


@admin.register(Flowcell)
class FlowcellAdmin(admin.ModelAdmin):
    form = FlowcellAdminForm
    list_display = ("flowcell_id_or_quote_id", "pool_size", "quotes", "archived")
    list_display_links = ("flowcell_id_or_quote_id",)
    list_filter = ("pool_size", ArchivedFilter)
    autocomplete_fields = ("sequencing_quotes",)
    exclude = (
        "lanes",
        "requests",
    )
    inlines = [LaneInline]

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )

    def format_quotes(self, obj):
        quotes = obj.sequencing_quotes.select_related("sequencing_provider").only(
            "quote_id", "sequencing_provider__name"
        )

        if not quotes.exists():
            return "-"

        # There should ever be only one sequencing provider per flowcell
        sequencing_provider = quotes.values_list(
            "sequencing_provider__name", flat=True
        ).first()

        quote_ids = list(quotes.values_list("quote_id", flat=True))

        return f"{sequencing_provider} - {', '.join(quote_ids)}"

    @admin.display(description="Flowcell / Quote ID")
    def flowcell_id_or_quote_id(self, obj):
        if obj.flowcell_id:
            return obj.flowcell_id

        return self.format_quotes(obj)

    @admin.display(description="Quotes")
    def quotes(self, obj):
        return self.format_quotes(obj)

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)


@admin.register(Lane)
class LaneAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
    )

    fields = (
        "name",
        "pool",
        "loading_concentration",
        "phix",
        "completed",
    )

    readonly_fields = (
        "name",
        "pool",
    )

    def has_module_permission(self, request):
        return False


@admin.register(SequencingProvider)
class SequencingProviderAdmin(admin.ModelAdmin):
    list_display = ("name", "archived")
    list_filter = (ArchivedFilter,)

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)


class FlowcellQuoteInline(admin.TabularInline):
    model = Flowcell.sequencing_quotes.through
    extra = 1
    fk_name = "sequencingquote"
    fields = ("flowcell",)
    verbose_name = "Flowcell"
    verbose_name_plural = "Flowcells"
    readonly_fields = ("flowcell",)


@admin.register(SequencingQuote)
class SequencingQuoteAdmin(admin.ModelAdmin):
    list_filter = ("quote_id",)
    list_display = (
        "quote_id",
        "sequencing_provider",
        "date_created",
        "price_amount",
        "flowcell_ids",
    )
    search_fields = ("quote_id", "sequencing_provider__name")
    ordering = ("-date_created",)
    inlines = [FlowcellQuoteInline]

    @admin.display(description="Price")
    def price_amount(self, obj):
        return f"{obj.price} €" if obj.price else "-"

    @admin.display(description="Flowcells")
    def flowcell_ids(self, obj):
        flowcells = obj.flowcells.all().only("flowcell_id")
        if flowcells.exists():
            return ", ".join({f.flowcell_id or obj.quote_id for f in flowcells})
        return "-"


@admin.register(SampleSheetSchema)
class SampleSheetSchemaAdmin(admin.ModelAdmin):
    list_display = ("name", "archived")
    list_filter = (ArchivedFilter,)
    search_fields = ("name",)
    ordering = ("name",)

    actions = (
        "mark_as_archived",
        "mark_as_non_archived",
    )

    @admin.action(description="Mark as archived")
    def mark_as_archived(self, request, queryset):
        queryset.update(archived=True)

    @admin.action(description="Mark as non-archived")
    def mark_as_non_archived(self, request, queryset):
        queryset.update(archived=False)
