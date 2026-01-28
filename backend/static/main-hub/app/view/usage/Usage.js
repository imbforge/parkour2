Ext.define("MainHub.view.usage.Usage", {
  extend: "Ext.container.Container",
  xtype: "usage",

  requires: [
    "MainHub.view.usage.UsageController",
    "MainHub.view.usage.Records",
    "MainHub.view.usage.Organizations",
    "MainHub.view.usage.PrincipalInvestigators",
    "MainHub.view.usage.LibraryTypes",
    "Ext.ux.layout.ResponsiveColumn",
    "Ext.ux.DateRangePicker"
  ],

  controller: "usage",

  layout: "responsivecolumn",

  items: [
    {
      xtype: "container",
      items: [
        {
          xtype: "button",
          id: "download-report-button",
          itemId: "download-report-button",
          cls: "download-report-button",
          iconCls: "fa fa-download fa-lg",
          text: "Download Report"
        }
      ]
    },
    {
      xtype: "container",
      userCls: "big-100",
      style: { textAlign: "center" },
      id: "usageFilterBar",
      itemId: "usageFilterBar",
      layout: {
        type: "hbox",
        pack: "left",
        align: "center"
      },
      items: [
        {
          xtype: "daterangepicker",
          id: "datePicker",
          itemId: "datePicker",
          ui: "header",
          cls: "daterangepicker",
          padding: 0,
          drpDefaults: {
            showButtonTip: false,
            dateFormat: "d.m.Y",
            mainBtnTextColor: "#999",
            mainBtnIconCls: "x-fa fa-calendar",
            presetPeriodsBtnIconCls: "x-fa fa-calendar-check-o",
            confirmBtnIconCls: "x-fa fa-check"
          }
        },
        {
          xtype: "combobox",
          id: "statusCb",
          itemId: "statusCb",
          fieldLabel: "Status",
          labelWidth: 40,
          width: 170,
          padding: "0 0 0 10px",
          store: Ext.create("Ext.data.Store", {
            fields: ["name", "label"],
            data: [
              { status: "submitted", label: "Submitted" },
              { status: "sequenced", label: "Sequenced" }
            ],
            proxy: { type: "memory" }
          }),
          queryMode: "local",
          displayField: "label",
          valueField: "status",
          forceSelection: true,
          listeners: {
            afterrender: function () {
              // Set default value upon rendering
              this.setValue("submitted");
            }
          }
        },
        {
          xtype: "combobox",
          itemId: "usage-organization-combobox",
          fieldLabel: "Organization",
          store: "UsageOrganizationSelection",
          queryMode: "local",
          valueField: "id",
          displayField: "name",
          forceSelection: false,
          labelWidth: 80,
          width: 220,
          padding: "0 0 0 10px"
        },
        {
          xtype: "combobox",
          itemId: "usage-pi-combobox",
          fieldLabel: "PI",
          store: "UsagePrincipalInvestigatorSelection",
          queryMode: "local",
          valueField: "id",
          displayField: "name",
          forceSelection: false,
          labelWidth: 17,
          width: 220,
          padding: "0 0 0 10px"
        }
      ]
    },
    {
      xtype: "usagerecords",
      userCls: "big-50 small-100"
    },
    {
      xtype: "usageorganizations",
      userCls: "big-50 small-100"
    },
    {
      xtype: "usageprincipalinvestigators",
      userCls: "big-50 small-100"
    },
    {
      xtype: "usagelibrarytypes",
      userCls: "big-50 small-100"
    }
    // {
    //   xtype: 'container',
    //   userCls: 'big-100',
    //   html: '<hr style="border-top:1px solid #bdbdbd">',
    //   style: { background: 'transparent' },
    //   border: 0
    // }
  ]
});
