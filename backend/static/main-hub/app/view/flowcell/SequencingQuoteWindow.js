Ext.define("MainHub.view.flowcell.SequencingQuoteWindow", {
  extend: "Ext.window.Window",
  requires: ["MainHub.view.flowcell.SequencingQuoteWindowController"],

  controller: "flowcell-sequencing-quote-window",

  title: "Sequencing Quote",
  modal: true,
  autoShow: true,

  width: 580,
  height: 400,
  layout: "fit",

  items: [
    {
      xtype: "form",
      id: "flowcell-sq-form",
      padding: "15 15 0 15",
      border: 0,
      autoScroll: true,
      defaults: {
        width: 520,
        labelWidth: 140
      },
      items: [
        {
          xtype: "label",
          html: "Fields marked in <b>bold</b> are required."
        },
        {
          xtype: "textfield",
          name: "SQ-Quote-Id",
          fieldLabel: "<b>Quote ID</b>",
          allowBlank: false,
          padding: "10 0 0 0"
        },
        {
          xtype: "datefield",
          name: "SQ-Date-Created",
          fieldLabel: "<b>Date</b>",
          allowBlank: false,
          format: "d.m.Y"
        },
        {
          xtype: "textfield",
          name: "SQ-Data-Delivery-Method",
          fieldLabel: "<b>Data Delivery Method</b>",
          allowBlank: false
        },
        {
          xtype: "numberfield",
          name: "SQ-Price",
          fieldLabel: "<b>Price</b>",
          allowBlank: false
        },
        {
          xtype: "textareafield",
          name: "SQ-Notes",
          fieldLabel: "Notes",
          allowBlank: true
        }
      ]
    }
  ],

  dockedItems: [
    {
      xtype: "toolbar",
      dock: "bottom",
      items: [
        "->",
        {
          xtype: "button",
          itemId: "flowcell-sq-cancel-button",
          iconCls: "fa fa-ban fa-lg",
          text: "Cancel"
        },
        {
          xtype: "button",
          itemId: "flowcell-sq-save-button",
          text: "Save",
          iconCls: "fa fa-floppy-o fa-lg"
        }
      ]
    }
  ]
});
