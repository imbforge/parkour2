Ext.define("validator.IndexIndexGenerator", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.IndexIndexGenerator",
  validate: function (value, record) {
    var pattern = new RegExp("^(?=(?:.{6}|.{8}|.{10}|.{12}|.{24})$)[ATCG]+$");
    return (
      value === null ||
      value === "" ||
      pattern.test(value) ||
      "If present, must have the correct format"
    );
  }
});

Ext.define("MainHub.model.indexgenerator.Record", {
  extend: "MainHub.model.Base",

  fields: [
    {
      name: "pk",
      type: "int"
    },
    {
      name: "name",
      type: "string"
    },
    {
      name: "barcode",
      type: "string"
    },
    {
      name: "record_type",
      type: "string"
    },
    {
      name: "request",
      type: "int"
    },
    {
      name: "request_name",
      type: "string"
    },
    {
      name: "sequencing_depth",
      type: "float"
    },
    {
      name: "library_protocol_name",
      type: "string"
    },
    {
      name: "index_i7",
      type: "string"
    },
    {
      name: "index_i5",
      type: "string"
    },
    {
      name: "index_i7_id",
      type: "string"
    },
    {
      name: "index_i5_id",
      type: "string"
    },
    {
      name: "index_type",
      type: "int"
    },
    {
      name: "index_reads",
      type: "int"
    },
    {
      name: "read_length",
      type: "int"
    }
  ],

  validators: {
    index_i7: "IndexIndexGenerator",
    index_i5: "IndexIndexGenerator"
  }
});
