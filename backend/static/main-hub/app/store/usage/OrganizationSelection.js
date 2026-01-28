Ext.define("MainHub.store.usage.OrganizationSelection", {
  extend: "Ext.data.Store",
  storeId: "UsageOrganizationSelection",

  requires: ["MainHub.model.usage.ChartPolar"],

  model: "MainHub.model.usage.ChartPolar",

  proxy: {
    type: "ajax",
    url: "api/usage/organizations/",
    timeout: 1000000,
    pageParam: false, // to remove param "page"
    startParam: false, // to remove param "start"
    limitParam: false, // to remove param "limit"
    noCache: false, // to remove param "_dc",
    extraParams: {
      selection: null
    }
  },

  getId: function () {
    return "UsageOrganizationSelection";
  }
});
