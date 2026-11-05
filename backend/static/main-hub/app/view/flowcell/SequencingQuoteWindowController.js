Ext.define("MainHub.view.flowcell.SequencingQuoteWindowController", {
  extend: "Ext.app.ViewController",
  alias: "controller.flowcell-sequencing-quote-window",

  config: {
    control: {
      "#": {
        boxready: "boxready"
      },
      "#flowcell-sq-save-button": {
        click: "save"
      },
      "#flowcell-sq-cancel-button": {
        click: "cancel"
      }
    }
  },

  boxready: function (wnd) {
    var flowcellForm = Ext.getCmp("flowcell-form").getForm();
    var quoteValues = flowcellForm.getFieldValues()["quote"];
    if (quoteValues) {
      var sqForm = wnd.down("#flowcell-sq-form").getForm();
      sqForm.setValues(quoteValues);
    }
  },

  save: function (btn) {
    var wnd = btn.up("window");
    var sqForm = wnd.down("#flowcell-sq-form").getForm();
    if (!sqForm.isValid()) {
      new Noty({
        text:
          "The form is invalid. Check the fields with " +
          "errors and amend them accordingly.",
        type: "warning"
      }).show();
      return;
    }

    var flowcellForm = Ext.getCmp("flowcell-form");
    sqValues = sqForm.getFieldValues();
    flowcellForm.getForm().setValues({ quote: sqValues });
    wnd.close();
  },

  cancel: function (btn) {
    var wnd = btn.up("window");
    var flowcellForm = Ext.getCmp("flowcell-form");
    flowcellForm.getForm().setValues({ quote: null });
    wnd.close();
  }
});
