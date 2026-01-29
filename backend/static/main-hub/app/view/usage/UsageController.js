Ext.define("MainHub.view.usage.UsageController", {
  extend: "Ext.app.ViewController",
  alias: "controller.usage",

  config: {
    control: {
      "#": {
        activate: "activate"
      },
      daterangepicker: {
        select: "loadData"
      },
      "#statusCb": {
        select: "loadData"
      },
      "#usage-organization-combobox": {
        select: "loadData"
      },
      "#usage-pi-combobox": {
        select: "loadData"
      },
      usagerecords: {},
      "#download-report-button": {
        click: "downloadReport"
      }
    }
  },

  activate: function (view) {
    var organizationCb = view.down("#usage-organization-combobox");
    organizationCb.getStore().load();
    organizationCb.setValue(-1);
    var piCb = view.down("#usage-pi-combobox");
    piCb.getStore().load();
    piCb.setValue(-1);
    this.loadData(organizationCb);
  },

  loadData: function (field) {
    var chartPanels = [
      "usagerecords",
      "usageorganizations",
      "usageprincipalinvestigators",
      "usagelibrarytypes"
    ];

    var view = field.up("usage");

    // Get relevant values
    var organizationCb = view.down("#usage-organization-combobox");
    var organization = organizationCb.getValue();
    var piCb = view.down("#usage-pi-combobox");
    var pi = piCb.getValue();
    var dateRange = view.down("daterangepicker").getPickerValue();

    loadParams = {
      start: dateRange.startDateObj,
      end: dateRange.endDateObj,
      status: view.down("#statusCb").getValue(),
      organization: organization > 0 ? organization : null,
      pi: pi > 0 ? pi : null
    };

    // Set options for organization combobox
    organizationCb.getStore().load({
      params: loadParams
    });

    // Set options for organization combobox
    piCb.getStore().load({
      params: loadParams
    });

    chartPanels.forEach(function (name) {
      var panel = view.down(name);
      var emptyText = panel.down("#empty-text");
      var polar = panel.down("polar");
      var cartesian = panel.down("cartesian");

      panel.setLoading();
      polar.getStore().load({
        params: loadParams,
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

    params = {
      start: start,
      end: end,
      status: view.down("#statusCb").getValue(),
      organization: view.down("#usage-organization-combobox").getValue(),
      pi: view.down("#usage-pi-combobox").getValue()
    };

    // Use fetch rather than form submit, below
    // This is the only way I found to make the loading
    // respond to report being successfully downloaded

    view.setLoading("Processing, please wait...");
    const submitUrl = new URL(window.location.origin + "/api/usage/report/");
    // Set query parameters
    Object.keys(params).forEach(function (key) {
      submitUrl.searchParams.set(key, params[key]);
    });

    // Get report
    fetch(submitUrl)
      .then(function (response) {
        return response.blob();
      })
      .then(function (blob) {
        // Create dummy a element to store file
        var urlDownloadFile = window.URL.createObjectURL(blob);
        var aDummy = document.createElement("a");
        aDummy.style.display = "none";
        aDummy.href = urlDownloadFile;

        // Create file name
        var fileName = Ext.String.format(
          "ParkourUsageReport_{0}_{1}",
          dateRange.startDateYmd
            ? dateRange.startDateYmd.replaceAll("-", "")
            : "000000",
          dateRange.endDateYmd
            ? dateRange.endDateYmd.replaceAll("-", "")
            : "000000"
        );
        if (params["organization"] > 0) {
          fileName += Ext.String.format("_{0}", params["organization"]);
        }
        if (params["pi"] > 0) {
          fileName += Ext.String.format("_{0}", params["pi"]);
        }
        aDummy.download = Ext.String.format("{0}.xlsx", fileName);

        document.body.appendChild(aDummy);

        // Dowload file
        aDummy.click();
        window.URL.revokeObjectURL(urlDownloadFile);
        view.setLoading(false);
      })
      .catch(function (error) {
        view.setLoading(false);
        console.log(error);
        new Noty({
          text: "There was an error, the report could not be downloaded.",
          type: "error"
        }).show();
      });

    // var form = Ext.create("Ext.form.Panel", { standardSubmit: true });
    // form.submit({
    //   url: "/api/usage/report/",
    //   method: "GET",
    //   waitMsg : 'Test message',
    //   params: params,
    //   success: function () {
    //     console.log('hello');
    //     view.setLoading(false);
    //   },

    //   failure: function () {
    //     view.setLoading(false);
    //     new Noty({
    //       text: "There was an error, the report could not be downloaded.",
    //       type: "error",
    //     }).show();
    //   },
    // });
  }
});
