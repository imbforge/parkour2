Ext.define("MainHub.store.flowcell.SequencingProvider", {
  extend: "Ext.data.Store",
  storeId: "sequencingProvidersStore",

  requires: ["MainHub.model.flowcell.SequencingProvider"],

  model: "MainHub.model.flowcell.SequencingProvider",

  proxy: {
    type: "ajax",
    url: "api/sequencing_providers/",
    // timeout: 1000000,
    pageParam: false, //to remove param "page"
    startParam: false, //to remove param "start"
    limitParam: false, //to remove param "limit"
    noCache: false, //to remove param "_dc",
    reader: {
      type: "json",
      rootProperty: "data",
      successProperty: "success"
    }
  },

  autoLoad: true
});
