Ext.define("validator.IndexI7Batch", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.indexI7batch",
  validate: function (value, record) {
    var pattern = new RegExp("^(?=(?:.{6}|.{8}|.{10}|.{12}|.{24})$)[ATCG]+$");
    return (
      record.get("index_reads") === null ||
      record.get("index_reads") === 0 ||
      record.get("index_reads") === 5 ||
      (record.get("index_reads") > 5 && pattern.test(value)) ||
      "Must be present and have the correct format"
    );
  }
});

Ext.define("validator.IndexI5Batch", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.indexI5batch",
  validate: function (value, record) {
    var pattern = new RegExp("^(?=(?:.{6}|.{8}|.{10}|.{12}|.{24})$)[ATCG]+$");
    return (
      record.get("index_reads") === null ||
      record.get("index_reads") === 0 ||
      record.get("index_reads") === 7 ||
      ((record.get("index_reads") % 5 === 0 ||
        record.get("index_reads") % 2 === 0) &&
        pattern.test(value)) ||
      "Must be present and have the correct format"
    );
  }
});

Ext.define("MainHub.model.libraries.BatchAdd.Library", {
  extend: "MainHub.model.libraries.BatchAdd.Common",

  fields: [
    {
      type: "int",
      name: "mean_fragment_size",
      defaultValue: null
    },
    {
      type: "int",
      name: "index_type",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "int",
      name: "index_reads",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "string",
      name: "index_i7"
    },
    {
      type: "string",
      name: "index_i5"
    },
    {
      type: "float",
      name: "qpcr_result",
      allowNull: true,
      defaultValue: null
    }
  ],

  validators: {
    mean_fragment_size: "greaterthanzero",
    index_type: "presence",
    index_reads: "presence",
    index_i7: "IndexI7Batch",
    index_i5: "IndexI5Batch",
    amplification_cycles: "greaterthanzero"
  }
});
