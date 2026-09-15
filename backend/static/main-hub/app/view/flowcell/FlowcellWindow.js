Ext.define("MainHub.view.flowcell.FlowcellWindow", {
  extend: "Ext.window.Window",

  requires: ["MainHub.view.flowcell.FlowcellWindowController"],

  controller: "flowcell-window",

  title: "Load Flowcell",
  height: 595,
  width: 800,

  modal: true,
  resizable: false,
  autoShow: true,
  layout: "fit",

  items: [
    {
      layout: {
        type: "vbox",
        align: "stretch"
      },
      items: [
        {
          layout: "hbox",
          height: 420,
          border: 0,
          items: [
            {
              layout: "vbox",
              border: 0,
              items: [
                {
                  xtype: "form",
                  id: "flowcell-form",
                  padding: "15 15 0 15",
                  width: 396,
                  border: 0,
                  defaultType: "combobox",
                  defaults: {
                    submitEmptyText: false,
                    allowBlank: true,
                    labelWidth: 180,
                    width: 365
                  },
                  items: [
                    {
                      id: "sequencing-kit-field",
                      queryMode: "local",
                      displayField: "name",
                      valueField: "id",
                      name: "sequencing_kit",
                      fieldLabel: "Seq. Kit",
                      emptyText: "Sequencing Kit",
                      store: "PoolSizes",
                      forceSelection: true,
                      labelWidth: 68,
                      allowBlank: false
                    },
                    {
                      xtype: "textfield",
                      name: "flowcell_id",
                      itemId: "flowcell_id",
                      fieldLabel: "Flowcell ID",
                      emptyText: "Flowcell ID",
                      labelWidth: 68,
                      regex: /^[A-Za-z0-9]+$/,
                      regexText: "Only A-Z a-z and 0-9 are allowed",
                      allowBlank: true,
                      padding: 0
                    },
                    {
                      xtype: "fieldcontainer",
                      layout: "hbox",
                      fieldLabel: "Provider",
                      labelWidth: 68,
                      items: [
                        {
                          xtype: "combobox",
                          itemId: "sequencing-provider-cb",
                          name: "sequencing_provider",
                          queryMode: "local",
                          valueField: "id",
                          displayField: "name",
                          fieldLabel: "",
                          emptyText: "Name",
                          padding: "0 10px 0 0",
                          width: 160,
                          forceSelection: true,
                          allowBlank: false,
                          store: "sequencingProvidersStore",
                          listeners: {
                            change: function (cb, newValue, oldValue) {
                              // Toggle the flowcell_id and sequencing_provider_quote fields
                              // based on the selected provider
                              var selectedRecord = cb.getSelection();
                              var selectedName = selectedRecord
                                ? selectedRecord.get("name")
                                : cb.getRawValue();

                              var flowcellIdField = cb
                                .up("#flowcell-form")
                                .down("#flowcell_id");
                              var sequenceProviderQuoteField = cb
                                .up("#flowcell-form")
                                .down("#sequencing-provider-quote");

                              if (
                                (selectedName || "").toLowerCase() ===
                                "internal"
                              ) {
                                flowcellIdField.setDisabled(false);
                                flowcellIdField.allowBlank = false;
                                sequenceProviderQuoteField.setDisabled(true);
                                sequenceProviderQuoteField.allowBlank = true;
                              } else {
                                flowcellIdField.setDisabled(true);
                                flowcellIdField.allowBlank = true;
                                sequenceProviderQuoteField.setDisabled(false);
                                sequenceProviderQuoteField.allowBlank = false;
                              }
                            }
                          }
                        },
                        {
                          xtype: "textfield",
                          itemId: "sequencing-provider-quote",
                          name: "sequencing_provider_quote",
                          emptyText: "Quote",
                          width: 122,
                          allowBlank: true,
                          disabled: true
                        }
                      ]
                    },
                    {
                      xtype: "fieldset",
                      title:
                        "<span style='font-size:13px;'>Sample Sheet Generators<span>",
                      style: {
                        background: "white"
                      },
                      defaults: {
                        width: 440,
                        labelWidth: 140
                      },
                      items: [
                        {
                          xtype: "button",
                          itemId: "sample-sheet-illuminav2-button",
                          text: "Illumina v2",
                          margin: "0 0 10px 0",
                          cls: "x-btn-default-small",
                          width: 100,
                          border: 0
                        }
                      ]
                    },
                    {
                      name: "sample_sheet",
                      hidden: true
                    }
                  ]
                },
                {
                  xtype: "grid",
                  id: "flowcell-result-grid",
                  itemId: "flowcell-result-grid",
                  padding: "0 15",
                  width: 396,
                  height: 160,
                  viewConfig: {
                    markDirty: false,
                    stripeRows: false
                  },
                  enableColumnMove: false,
                  enableColumnResize: false,
                  enableColumnHide: false,
                  store: "lanesStore",
                  columns: [
                    {
                      text: "Pool",
                      dataIndex: "pool_name",
                      sortable: false,
                      flex: 1
                    },
                    {
                      text: "Lane",
                      dataIndex: "lane_name",
                      width: 70
                    }
                  ]
                }
              ]
            },
            {
              xtype: "grid",
              id: "pools-flowcell-grid",
              itemId: "pools-flowcell-grid",
              cls: "pools-flowcell",
              padding: "0 3 0 0",
              width: 400,
              height: 410,
              border: 0,
              viewConfig: {
                stripeRows: false,
                markDirty: false,
                // loadMask: false
                getRowClass: function (record) {
                  var rowClass = "";
                  if (record.get("ready")) {
                    rowClass = "pool-ready";
                  } else {
                    rowClass = "pool-not-ready";
                    record.setDisabled(true);
                  }
                  return rowClass;
                }
              },
              style: {
                borderLeft: "1px solid #d0d0d0"
              },
              store: "poolsStore",
              sortableColumns: false,
              enableColumnMove: false,
              enableColumnResize: false,
              enableColumnHide: false,
              columns: [
                {
                  text: "Pool",
                  dataIndex: "name",
                  flex: 1
                },
                {
                  text: "Read Length",
                  dataIndex: "read_length_name",
                  width: 100
                },
                {
                  text: "Size",
                  dataIndex: "pool_size_id",
                  width: 90,
                  renderer: function (value, meta) {
                    var pool = meta.record;

                    // Exact match
                    var poolSize = Ext.getStore("PoolSizes").findRecord(
                      "id",
                      value,
                      0,
                      false,
                      true,
                      true
                    );

                    var size = pool.get("pool_size") - pool.get("loaded");
                    return size === 0
                      ? size
                      : size + "x" + poolSize.get("size") + "M";
                  }
                }
              ],
              plugins: [
                {
                  ptype: "bufferedrenderer",
                  trailingBufferZone: 100,
                  leadingBufferZone: 100
                }
              ]
            }
          ]
        },
        {
          id: "lanes",
          layout: {
            type: "hbox",
            align: "center",
            pack: "center"
          },
          border: 0,
          style: {
            borderTop: "1px solid #d0d0d0"
          },
          height: 80,
          defaults: {
            margin: 8,
            height: 60
          },
          items: []
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
          itemId: "save-button",
          text: "Save",
          iconCls: "fa fa-floppy-o fa-lg"
        }
      ]
    }
  ]
});
