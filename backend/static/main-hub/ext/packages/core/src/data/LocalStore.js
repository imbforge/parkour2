/**
 * A mixin that provides common store methods for Ext.data.Store & Ext.data.ChainedStore.
 * @private
 */
Ext.define("Ext.data.LocalStore", {
  extend: "Ext.Mixin",

  mixinConfig: {
    id: "localstore"
  },

  config: {
    extraKeys: null
  },

  applyExtraKeys: function (extraKeys) {
    var indexName,
      data = this.getData();

    // Add the extra keys to the data collection
    data.setExtraKeys(extraKeys);

    // Pluck the extra keys out so that we can keep them by index name
    extraKeys = data.getExtraKeys();

    for (indexName in extraKeys) {
      this[indexName] = extraKeys[indexName];
    }
  },

  /**
   * Adds Model instance to the Store. This method accepts either:
   *
   * - An array of Model instances or Model configuration objects.
   * - Any number of Model instance or Model configuration object arguments.
   *
   * The new Model instances will be added at the end of the existing collection.
   *
   * Sample usage:
   *
   *     myStore.add({some: 'data'}, {some: 'other data'});
   *
   * Note that if this Store is sorted, the new Model instances will be inserted
   * at the correct point in the Store to maintain the sort order.
   *
   * @param {Ext.data.Model[]/Ext.data.Model.../Object[]/Object...} model An array of Model instances
   * or Model configuration objects, or variable number of Model instance or config arguments.
   * @return {Ext.data.Model[]} The model instances that were added
   */
  add: function (arg) {
    return this.insert(
      this.getCount(),
      arguments.length === 1 ? arg : arguments
    );
  },

  constructDataCollection: function () {
    var result = new Ext.util.Collection({
      rootProperty: "data"
    });

    // Add this store as an observer immediately so that we are informed of any
    // synchronous autoLoad which may occur in this event.
    result.addObserver(this);

    return result;
  },

  /**
   * Converts a literal to a model, if it's not a model already
   * @private
   * @param {Ext.data.Model/Object} record The record to create
   * @return {Ext.data.Model}
   */
  createModel: function (record) {
    var session = this.getSession(),
      Model;

    if (!record.isModel) {
      Model = this.getModel();
      record = new Model(record, session);
    }
    return record;
  },

  createFiltersCollection: function () {
    return this.getData().getFilters();
  },

  createSortersCollection: function () {
    var sorters = this.getData().getSorters();
    sorters.setSorterConfigure(this.addFieldTransform, this);
    return sorters;
  },

  onCollectionBeginUpdate: function () {
    this.beginUpdate();
  },

  onCollectionEndUpdate: function () {
    this.endUpdate();
  },

  // When the collection informs us that it has sorted, this LocalStore must react.
  // AbstractStore#onSorterEndUpdate does the correct thing (fires a refresh) if remote sorting is false
  onCollectionSort: function () {
    this.onSorterEndUpdate();
  },

  // When the collection informs us that it has filtered, this LocalStore must react.
  // AbstractStore#onFilterEndUpdate does the correct thing (fires a refresh) if remote sorting is false
  onCollectionFilter: function () {
    this.onFilterEndUpdate();
  },

  notifySorterChange: function () {
    this.getData().onSorterChange();
  },

  forceLocalSort: function () {
    this.getData().onSortChange();
  },

  // Inherit docs
  contains: function (record) {
    return this.indexOf(record) > -1;
  },

  /**
   * Calls the specified function for each {@link Ext.data.Model record} in the store.
   *
   * When store is filtered, only loops over the filtered records.
   *
   * @param {Function} fn The function to call. The {@link Ext.data.Model Record} is passed as the first parameter.
   * Returning `false` aborts and exits the iteration.
   * @param {Object} [scope] The scope (`this` reference) in which the function is executed.
   * Defaults to the current {@link Ext.data.Model record} in the iteration.
   * @param {Object} [includeOptions] An object which contains options which modify how the store is traversed.
   * @param {Boolean} [includeOptions.filtered] Pass `true` to include filtered out nodes in the iteration.
   *
   * Note that the `filtered` option can also be passed as a separate parameter for
   * compatibility with previous versions.
   *
   */
  each: function (fn, scope, bypassFilters) {
    var data = this.getData(),
      len,
      record,
      i;

    if (typeof bypassFilters === "object") {
      bypassFilters = bypassFilters.filtered;
    }

    if (bypassFilters === true && data.filtered) {
      data = data.getSource();
    }
    data = data.items.slice(0); // safe for re-entrant calls
    len = data.length;

    for (i = 0; i < len; ++i) {
      record = data[i];
      if (fn.call(scope || record, record, i, len) === false) {
        break;
      }
    }
  },

  /**
   * Collects unique values for a particular dataIndex from this store.
   *
   * Note that the `filtered` option can also be passed as a separate parameter for
   * compatibility with previous versions.
   *
   *     var store = Ext.create('Ext.data.Store', {
   *         fields: ['name'],
   *         data: [{
   *             name: 'Larry'
   *         }, {
   *             name: 'Darryl'
   *         }, {
   *             name: 'Darryl'
   *         }]
   *     });
   *
   *     store.collect('name');
   *     // returns ["Larry", "Darryl"]
   *
   * @param {String} property The property to collect
   * @param {Object} [includeOptions] An object which contains options which modify how the store is traversed.
   * @param {Boolean} [includeOptions.allowNull] Pass true to allow null, undefined or empty string values.
   * @param {Boolean} [includeOptions.filtered] Pass `true` to collect from all records, even ones which are filtered.
   *
   * @return {Object[]} An array of the unique values
   */
  collect: function (dataIndex, allowNull, bypassFilters) {
    var me = this,
      data = me.getData();

    if (typeof allowNull === "object") {
      bypassFilters = allowNull.filtered;
      allowNull = allowNull.allowNull;
    }

    if (bypassFilters === true && data.filtered) {
      data = data.getSource();
    }

    return data.collect(dataIndex, "data", allowNull);
  },

  /**
   * Get the Record with the specified id.
   *
   * This method is not affected by filtering, lookup will be performed from all records
   * inside the store, filtered or not.
   *
   * @param {Mixed} id The id of the Record to find.
   * @return {Ext.data.Model} The Record with the passed id. Returns null if not found.
   */
  getById: function (id) {
    var data = this.getData();

    if (data.filtered) {
      data = data.getSource();
    }
    return data.get(id) || null;
  },

  /**
   * @private
   * Get the Record with the specified internalId.
   *
   * This method is not affected by filtering, lookup will be performed from all records
   * inside the store, filtered or not.
   *
   * @param {Mixed} internalId The id of the Record to find.
   * @return {Ext.data.Model} The Record with the passed internalId. Returns null if not found.
   */
  getByInternalId: function (internalId) {
    var data = this.getData(),
      keyCfg;

    if (data.filtered) {
      if (!data.$hasExtraKeys) {
        keyCfg = this.makeInternalKeyCfg();
        data.setExtraKeys(keyCfg);
        data.$hasExtraKeys = true;
      }
      data = data.getSource();
    }

    if (!data.$hasExtraKeys) {
      data.setExtraKeys(keyCfg || this.makeInternalKeyCfg());
      data.$hasExtraKeys = true;
    }

    return data.byInternalId.get(internalId) || null;
  },

  /**
   * Returns the complete unfiltered collection.
   * @private
   */
  getDataSource: function () {
    var data = this.getData();
    return data.getSource() || data;
  },

  /**
   * Get the index of the record within the store.
   *
   * When store is filtered, records outside of filter will not be found.
   *
   * @param {Ext.data.Model} record The Ext.data.Model object to find.
   * @return {Number} The index of the passed Record. Returns -1 if not found.
   */
  indexOf: function (record) {
    return this.getData().indexOf(record);
  },

  /**
   * Get the index within the store of the Record with the passed id.
   *
   * Like #indexOf, this method is affected by filtering.
   *
   * @param {String} id The id of the Record to find.
   * @return {Number} The index of the Record. Returns -1 if not found.
   */
  indexOfId: function (id) {
    return this.indexOf(this.getById(id));
  },

  /**
   * Inserts Model instances into the Store at the given index and fires the add event.
   * See also {@link #method-add}.
   *
   * @param {Number} index The start index at which to insert the passed Records.
   * @param {Ext.data.Model/Ext.data.Model[]/Object/Object[]} records An `Ext.data.Model` instance, the
   * data needed to populate an instance or an array of either of these.
   *
   * @return {Ext.data.Model[]} records The added records
   */
  insert: function (index, records) {
    var me = this,
      len,
      i;

    if (records) {
      if (!Ext.isIterable(records)) {
        records = [records];
      } else {
        records = Ext.Array.clone(records);
      }
      len = records.length;
    }

    if (!len) {
      return [];
    }

    for (i = 0; i < len; ++i) {
      records[i] = me.createModel(records[i]);
    }

    me.getData().insert(index, records);
    return records;
  },

  /**
   * Query all the cached records in this Store using a filtering function. The specified function
   * will be called with each record in this Store. If the function returns `true` the record is
   * included in the results.
   *
   * This method is not affected by filtering, it will always search *all* records in the store
   * regardless of filtering.
   *
   * @param {Function} fn The function to be called. It will be passed the following parameters:
   *  @param {Ext.data.Model} fn.record The record to test for filtering. Access field values
   *  using {@link Ext.data.Model#get}.
   *  @param {Object} fn.id The ID of the Record passed.
   * @param {Object} [scope] The scope (this reference) in which the function is executed
   * Defaults to this Store.
   * @return {Ext.util.Collection} The matched records
   */
  queryBy: function (fn, scope) {
    var data = this.getData();

    return (data.getSource() || data).createFiltered(fn, scope);
  },

  /**
   * Query all the cached records in this Store by name/value pair.
   * The parameters will be used to generated a filter function that is given
   * to the queryBy method.
   *
   * This method complements queryBy by generating the query function automatically.
   *
   * This method is not affected by filtering, it will always search *all* records in the store
   * regardless of filtering.
   *
   * @param {String} property The property to create the filter function for
   * @param {String/RegExp} value The string/regex to compare the property value to
   * @param {Boolean} [anyMatch=false] True to match any part of the string, not just the
   * beginning.
   * @param {Boolean} [caseSensitive=false] `true` to create a case-sensitive regex.
   * @param {Boolean} [exactMatch=false] True to force exact match (^ and $ characters
   * added to the regex). Ignored if `anyMatch` is `true`.
   * @return {Ext.util.Collection} The matched records
   */
  query: function (property, value, anyMatch, caseSensitive, exactMatch) {
    var data = this.getData();

    return (data.getSource() || data).createFiltered(
      property,
      value,
      anyMatch,
      caseSensitive,
      exactMatch
    );
  },

  /**
   * Convenience function for getting the first model instance in the store.
   *
   * When store is filtered, will return first item within the filter.
   *
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the first record being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Ext.data.Model/undefined} The first model instance in the store, or undefined
   */
  first: function (grouped) {
    return this.getData().first(grouped) || null;
  },

  /**
   * Convenience function for getting the last model instance in the store.
   *
   * When store is filtered, will return last item within the filter.
   *
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the last record being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Ext.data.Model/undefined} The last model instance in the store, or undefined
   */
  last: function (grouped) {
    return this.getData().last(grouped) || null;
  },

  /**
   * Sums the value of `field` for each {@link Ext.data.Model record} in store
   * and returns the result.
   *
   * When store is filtered, only sums items within the filter.
   *
   * @param {String} field A field in each record
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the sum for that group being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Number} The sum
   */
  sum: function (field, grouped) {
    var data = this.getData();
    return grouped && this.isGrouped()
      ? data.sumByGroup(field)
      : data.sum(field);
  },

  /**
   * Gets the count of items in the store.
   *
   * When store is filtered, only items within the filter are counted.
   *
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the count for each group being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Number} the count
   */
  count: function (grouped) {
    var data = this.getData();
    return grouped && this.isGrouped() ? data.countByGroup() : data.count();
  },

  /**
   * Gets the minimum value in the store.
   *
   * When store is filtered, only items within the filter are aggregated.
   *
   * @param {String} field The field in each record
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the minimum in the group being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Object} The minimum value, if no items exist, undefined.
   */
  min: function (field, grouped) {
    var data = this.getData();
    return grouped && this.isGrouped()
      ? data.minByGroup(field)
      : data.min(field);
  },

  /**
   * Gets the maximum value in the store.
   *
   * When store is filtered, only items within the filter are aggregated.
   *
   * @param {String} field The field in each record
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the maximum in the group being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Object} The maximum value, if no items exist, undefined.
   */
  max: function (field, grouped) {
    var data = this.getData();
    return grouped && this.isGrouped()
      ? data.maxByGroup(field)
      : data.max(field);
  },

  /**
   * Gets the average value in the store.
   *
   * When store is filtered, only items within the filter are aggregated.
   *
   * @param {String} field The field in each record
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the group average being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @return {Object} The average value, if no items exist, 0.
   */
  average: function (field, grouped) {
    var data = this.getData();
    return grouped && this.isGrouped()
      ? data.averageByGroup(field)
      : data.average(field);
  },

  /**
   * Runs the aggregate function for all the records in the store.
   *
   * When store is filtered, only items within the filter are aggregated.
   *
   * @param {Function} fn The function to execute. The function is called with a single parameter,
   * an array of records for that group.
   * @param {Object} [scope] The scope to execute the function in. Defaults to the store.
   * @param {Boolean} [grouped] True to perform the operation for each group
   * in the store. The value returned will be an object literal with the key being the group
   * name and the group average being the value. The grouped parameter is only honored if
   * the store has a groupField.
   * @param {String} field The field to get the value from
   * @return {Object} An object literal with the group names and their appropriate values.
   */
  aggregate: function (fn, scope, grouped, field) {
    var me = this,
      groups,
      len,
      out,
      group,
      i;

    if (grouped && me.isGrouped()) {
      groups = me.getGroups().items;
      len = groups.length;
      out = {};

      for (i = 0; i < len; ++i) {
        group = groups[i];
        out[group.getGroupKey()] = me.getAggregate(
          fn,
          scope || me,
          group.items,
          field
        );
      }
      return out;
    } else {
      return me.getAggregate(fn, scope, me.getData().items, field);
    }
  },

  getAggregate: function (fn, scope, records, field) {
    var values = [],
      len = records.length,
      i;

    //TODO EXTJSIV-12307 - not the right way to call fn
    for (i = 0; i < len; ++i) {
      values[i] = records[i].get(field);
    }

    return fn.call(scope || this, records, values);
  },

  addObserver: function (observer) {
    var observers = this.observers;

    if (!observers) {
      this.observers = observers = new Ext.util.Collection();
    }

    observers.add(observer);
  },

  removeObserver: function (observer) {
    var observers = this.observers;

    if (observers) {
      observers.remove(observer);
    }
  },

  callObservers: function (action, args) {
    var observers = this.observers,
      len,
      items,
      i,
      methodName,
      item;

    if (observers) {
      items = observers.items;
      if (args) {
        args.unshift(this);
      } else {
        args = [this];
      }
      for (i = 0, len = items.length; i < len; ++i) {
        item = items[i];
        methodName = "onSource" + action;
        if (item[methodName]) {
          item[methodName].apply(item, args);
        }
      }
    }
  },

  /**
   * Query all the cached records in this Store using a filtering function. The specified function
   * will be called with each record in this Store. If the function returns `true` the record is
   * included in the results.
   *
   * This method is not affected by filtering, it will always search *all* records in the store
   * regardless of filtering.
   *
   * @param {Function} fn The function to be called. It will be passed the following parameters:
   *   @param {Ext.data.Model} fn.record The record to test for filtering.
   * @param {Object} [scope] The scope (this reference) in which the function is executed
   * Defaults to this Store.
   * @return {Ext.data.Model[]} The matched records.
   *
   * @private
   */
  queryRecordsBy: function (fn, scope) {
    var data = this.getData(),
      matches = [],
      len,
      i,
      record;

    data = (data.getSource() || data).items;
    scope = scope || this;

    for (i = 0, len = data.length; i < len; ++i) {
      record = data[i];
      if (fn.call(scope, record) === true) {
        matches.push(record);
      }
    }
    return matches;
  },

  /**
   * Query all the cached records in this Store by field.
   *
   * This method is not affected by filtering, it will always search *all* records in the store
   * regardless of filtering.
   *
   * @param {String} field The field from each record to use.
   * @param {Object} value The value to match.
   * @return {Ext.data.Model[]} The matched records.
   *
   * @private
   */
  queryRecords: function (field, value) {
    var data = this.getData(),
      matches = [],
      len,
      i,
      record;

    data = (data.getSource() || data).items;

    for (i = 0, len = data.length; i < len; ++i) {
      record = data[i];
      if (record.get(field) === value) {
        matches.push(record);
      }
    }
    return matches;
  },

  privates: {
    isLast: function (record) {
      return record === this.last();
    },

    makeInternalKeyCfg: function () {
      return {
        byInternalId: {
          property: "internalId",
          rootProperty: ""
        }
      };
    }
  }
});
