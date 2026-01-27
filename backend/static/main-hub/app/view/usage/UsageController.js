Ext.define("MainHub.view.usage.UsageController", {
  extend: "Ext.app.ViewController",
  alias: "controller.usage",

  config: {
    control: {
      "#": {
        activate: "activate"
      },
      daterangepicker: {
        select: "setRange"
      },
      "#statusCb": {
        select: "setStatus"
      },
      "#usage-organization-combobox": {
        select: "setOrganization"
      },
      usagerecords: {},
      "#download-report-button": {
        click: "downloadReport"
      }
    }
  },

  activate: function (view) {
    var dateRange = view.down("daterangepicker");
    var status = view.down("#statusCb").getValue();
    var organizationCb = view.down("#usage-organization-combobox");
    organizationCb.getStore().reload();
    this.loadData(
      view,
      dateRange.getPickerValue(),
      status,
      organizationCb.getValue()
    );
  },

  setRange: function (drp, dateRange) {
    var view = drp.up("usage");
    var status = view.down("#statusCb").getValue();
    var organization = view.down("#usage-organization-combobox").getValue();
    this.loadData(view, dateRange, status, organization);
  },

  setStatus: function (cb) {
    var view = cb.up("usage");
    var dateRange = view.down("daterangepicker").getPickerValue();
    var organization = view.down("#usage-organization-combobox").getValue();
    this.loadData(view, dateRange, cb.getValue(), organization);
  },

  setOrganization: function (cb) {
    var view = cb.up("usage");
    var dateRange = view.down("daterangepicker").getPickerValue();
    var status = view.down("#statusCb").getValue();
    this.loadData(view, dateRange, status, cb.getValue());
  },

  loadData: function (view, dateRange, status, organization) {
    var chartPanels = [
      "usagerecords",
      "usageorganizations",
      "usageprincipalinvestigators",
      "usagelibrarytypes"
    ];

    chartPanels.forEach(function (name) {
      var panel = view.down(name);
      var emptyText = panel.down("#empty-text");
      var polar = panel.down("polar");
      var cartesian = panel.down("cartesian");

      panel.setLoading();
      polar.getStore().load({
        params: {
          start: dateRange.startDateObj,
          end: dateRange.endDateObj,
          status: status,
          organization: organization > 0 ? organization : null
        },
        callback: function (data) {
          panel.setLoading(false);
          if (
            data &&
            data.length > 0 &&
            Ext.Array.sum(
              Ext.Array.pluck(Ext.Array.pluck(data, "data"), "data")
            ) > 0
          ) {
            emptyText.hide();
            polar.show();
            if (cartesian) {
              cartesian.show();
            }
          } else {
            emptyText.show();
            polar.hide();
            if (cartesian) {
              cartesian.hide();
            }
          }
        }
      });
    });
  },

  downloadReport: function (btn) {
    var view = btn.up("usage");

    var dateRange = view.down("daterangepicker").getPickerValue();
    var start = dateRange.startDateFmt ? dateRange.startDateFmt : "";
    var end = dateRange.endDateFmt ? dateRange.endDateFmt : "";

    var status = view.down("#statusCb").getValue();
    var organization = view.down("#usage-organization-combobox").getValue();

    var form = Ext.create("Ext.form.Panel", { standardSubmit: true });
    form.submit({
      url: "/api/usage/report/",
      method: "GET",
      params: {
        start: start,
        end: end,
        status: status,
        organization: organization
      },
      failure: function () {
        new Noty({
          text: "There was an error, the report could not be downloaded.",
          type: "error"
        }).show();
      }
    });
  }
});
