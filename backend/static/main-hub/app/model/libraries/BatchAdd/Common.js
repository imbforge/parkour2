Ext.define("validator.Unique", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.unique",
  validate: function (value, record) {
    var dataIndex = this.dataIndex;
    var store = record.store;
    var values = [];

    store.each(function (item) {
      var currentValue = item.get(dataIndex);
      if (item !== record && currentValue !== "") {
        values.push(currentValue);
      }
    });

    return values.indexOf(value) === -1 || "Must be unique";
  }
});

Ext.define("validator.GreaterThanZero", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.greaterthanzero",
  validate: function (value) {
    return value > 0 || "Must be greater than 0";
  }
});

Ext.define("validator.GreaterThanTen", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.greaterthanten",
  validate: function (value) {
    return value >= 10 || "Must be greater or equal to 10";
  }
});

Ext.define("validator.Concentration", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.concentration",
  validate: function (value, record) {
    var isValid = true;
    var natId = record.get("nucleic_acid_type");

    // If natId is defined, it is a sample
    // otherwise it is a library

    if (natId) {
      // Sample
      var nat = Ext.getStore("nucleicAcidTypesStore").findRecord(
        "id",
        record.get("nucleic_acid_type")
      );

      if (nat && !nat.get("single_cell") && value === null) {
        isValid = false;
      }
    } else {
      // Library
      if (value === null) {
        isValid = false;
      }
    }

    return isValid || "Must be present";
  }
});

Ext.define("validator.BatchAddName", {
  extend: "Ext.data.validator.Validator",
  alias: "data.validator.batchaddname",

  validate: function (value) {
    var pattern =
      /^[A-Za-z0-9]+_[A-Za-z0-9]+_2[0-9]{3}_(?:0[1-9]|[1-9][0-9])_(?=\d{2,}_)[0-9]*[1-9]\d*(?:_[A-Za-z0-9]+)+$/;

    return (
      pattern.test(value) ||
      "• Only letters, numbers and underscores allowed<br>" +
        "• [organization]_[name]_[year]_[project number]_[sample number]_[... details]<br>" +
        "• Sample numbers must be at least 2 digits and zero-padded<br>" +
        "• At least one details field is required<br>" +
        "• e.g. imb_muster_2020_03_087_brca1_plusDox"
    );
  }
});

Ext.define("MainHub.model.libraries.BatchAdd.Common", {
  extend: "Ext.data.Model",

  fields: [
    {
      type: "string",
      name: "name"
    },
    {
      type: "int",
      name: "library_protocol",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "int",
      name: "library_type",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "float",
      name: "sequencing_depth",
      defaultValue: null
    },
    {
      name: "sample_volume_user",
      type: "int",
      allowNull: true,
      convert: function (v) {
        return v ? Number(v).toFixed(0) : null;
      }
    },
    {
      type: "float",
      name: "concentration",
      defaultValue: null
    },
    {
      type: "int",
      name: "concentration_method",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "int",
      name: "amplification_cycles",
      defaultValue: null
    },
    {
      type: "bool",
      name: "equal_representation_nucleotides"
    },
    {
      type: "int",
      name: "read_length",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "int",
      name: "organism",
      allowNull: true,
      defaultValue: null
    },
    {
      type: "string",
      name: "source"
    },
    {
      type: "string",
      name: "comments"
    },
    {
      type: "bool",
      name: "invalid",
      defaultValue: false
    },
    {
      type: "auto",
      name: "errors",
      defaultValue: {}
    }
  ],

  validators: {
    name: [
      {
        type: "presence"
      },
      {
        type: "batchaddname"
      },
      {
        type: "unique",
        dataIndex: "name"
      }
    ],
    library_protocol: "presence",
    library_type: "presence",
    concentration: "concentration",
    read_length: "presence",
    sequencing_depth: "greaterthanzero",
    amplification_cycles: "presence",
    concentration_method: "concentration",
    organism: "presence",
    source: "presence"
  }
});
