/**
 * @protected
 * Simple wrapper class that represents a set of records returned by a Proxy.
 */
Ext.define("Ext.data.ResultSet", {
  /**
   * @property {Boolean} isResultSet
   * Identifies this class as a result set.
   */
  isResultSet: true,

  $configPrefixed: false,

  config: {
    /**
     * @cfg {Boolean} loaded
     * True if the records have already been loaded. This is only meaningful when dealing with
     * SQL-backed proxies.
     */
    loaded: true,

    /**
     * @cfg {Number} count
     * The number of records in this ResultSet. Note that total may differ from this number.
     */
    count: null,

    /**
     * @cfg {Number} total
     * The total number of records reported by the data source. This ResultSet may form a subset of
     * those records (see {@link #count}).
     */
    total: null,

    /**
     * @cfg {Boolean} success
     * True if the ResultSet loaded successfully, false if any errors were encountered.
     */
    success: false,

    /**
     * @cfg {Ext.data.Model[]/Object[]} records (required)
     * The array of record instances or record config objects.
     */
    records: null,

    /**
     * @cfg {String} message
     * The message that was read in from the data
     */
    message: null,

    /**
     * @cfg {Object} metadata
     * The metadata object from a server sourced JSON data packet.
     */
    metadata: null
  },

  /**
   * Creates the resultSet
   * @param {Object} [config] Config object.
   */
  constructor: function (config) {
    this.initConfig(config);
  },

  getCount: function () {
    var count = this.callParent(),
      records;

    if (!count) {
      records = this.getRecords();
      if (records) {
        count = records.length;
      }
    }
    return count;
  }
});
