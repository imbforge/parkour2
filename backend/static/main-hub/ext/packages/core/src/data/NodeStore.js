/**
 * Node Store
 * @private
 */
Ext.define("Ext.data.NodeStore", {
  extend: "Ext.data.Store",
  alias: "store.node",
  requires: ["Ext.data.TreeModel", "Ext.data.NodeInterface"],

  /**
   * @property {Boolean} isNodeStore
   * `true` in this class to identify an object as an instantiated NodeStore, or subclass thereof.
   */
  isNodeStore: true,

  config: {
    /**
     * @cfg {Ext.data.Model} node The Record you want to bind this Store to. Note that
     * this record will be decorated with the {@link Ext.data.NodeInterface} if this is not the
     * case yet.
     * @accessor
     */
    node: null,

    /**
     * @cfg {Boolean} recursive Set this to `true` if you want this NodeStore to represent
     * all the descendants of the node in its flat data collection. This is useful for
     * rendering a tree structure to a DataView and is being used internally by
     * the TreeView. Any records that are moved, removed, inserted or appended to the
     * node at any depth below the node this store is bound to will be automatically
     * updated in this Store's internal flat data structure.
     * @accessor
     */
    recursive: false,

    /**
     * @cfg {Boolean} rootVisible `false` to not include the root node in this Stores collection.
     * @accessor
     */
    rootVisible: false,

    /**
     * @cfg {Boolean} folderSort
     * Set to `true` to automatically prepend a leaf sorter.
     */
    folderSort: false
  },

  implicitModel: "Ext.data.TreeModel",

  // NodeStores are never buffered or paged. They are loaded from the TreeStore to reflect all visible
  // nodes.
  // BufferedRenderer always asks for the *total* count, so this must return the count.
  getTotalCount: function () {
    return this.getCount();
  },

  updateFolderSort: function (folderSort) {
    var data = this.getData();

    data.setTrackGroups(false);
    if (folderSort) {
      data.setGrouper({
        groupFn: this.folderSortFn
      });
    } else {
      data.setGrouper(null);
    }
  },

  folderSortFn: function (node) {
    return node.data.leaf ? 1 : 0;
  },

  afterReject: function (record) {
    var me = this;
    // Must pass the 5th param (modifiedFieldNames) as null, otherwise the
    // event firing machinery appends the listeners "options" object to the arg list
    // which may get used as the modified fields array by a handler.
    // This array is used for selective grid cell updating by Grid View.
    // Null will be treated as though all cells need updating.
    if (me.contains(record)) {
      me.onUpdate(record, Ext.data.Model.REJECT, null);
      me.fireEvent("update", me, record, Ext.data.Model.REJECT, null);
    }
  },

  afterCommit: function (record, modifiedFieldNames) {
    var me = this;
    if (!modifiedFieldNames) {
      modifiedFieldNames = null;
    }
    if (me.contains(record)) {
      me.onUpdate(record, Ext.data.Model.COMMIT, modifiedFieldNames);
      me.fireEvent(
        "update",
        me,
        record,
        Ext.data.Model.COMMIT,
        modifiedFieldNames
      );
    }
  },

  onNodeAppend: function (parent, node) {
    if (parent === this.getNode()) {
      this.add([node].concat(this.retrieveChildNodes(node)));
    }
  },

  onNodeInsert: function (parent, node, refNode) {
    var me = this,
      idx;

    if (parent === me.getNode()) {
      idx = me.indexOf(refNode) || 0;
      me.insert(0, [node].concat(me.retrieveChildNodes(node)));
    }
  },

  onNodeRemove: function (parent, node) {
    if (parent === this.getNode()) {
      this.remove([node].concat(this.retrieveChildNodes(node)));
    }
  },

  onNodeExpand: function (parent, records) {
    if (parent === this.getNode()) {
      this.loadRecords(records);
    }
  },

  applyNode: function (node) {
    if (node) {
      if (!node.isModel) {
        node = new (this.getModel())(node);
      }
      if (!node.isNode) {
        Ext.data.NodeInterface.decorate(node);
      }
    }
    return node;
  },

  updateNode: function (node, oldNode) {
    var me = this,
      data;

    if (oldNode && !oldNode.destroyed) {
      oldNode.un({
        append: "onNodeAppend",
        insert: "onNodeInsert",
        remove: "onNodeRemove",
        scope: me
      });
      oldNode.unjoin(me);
    }

    if (node) {
      node.on({
        scope: me,
        append: "onNodeAppend",
        insert: "onNodeInsert",
        remove: "onNodeRemove"
      });

      node.join(me);

      data = [];
      if (node.childNodes.length) {
        data = data.concat(me.retrieveChildNodes(node));
      }
      if (me.getRootVisible()) {
        data.push(node);
      } else if (node.isLoaded() || node.isLoading()) {
        node.set("expanded", true);
      }

      me.getData().clear();
      me.fireEvent("clear", me);

      me.suspendEvents();
      if (me.isInitializing) {
        me.inlineData = data;
      } else {
        me.add(data);
      }
      me.resumeEvents();

      if (data.length === 0) {
        me.loaded = node.loaded = true;
      }

      me.fireEvent("refresh", me, me.data);
    }
  },

  /**
   * @param {Object} node
   * @return {Boolean}
   */
  isVisible: function (node) {
    var parent = node.parentNode;

    if (!this.getRecursive() && parent !== this.getNode()) {
      return false;
    }

    while (parent) {
      if (!parent.isExpanded()) {
        return false;
      }

      //we need to check this because for a nodestore the node is not likely to be the root
      //so we stop going up the chain when we hit the original node as we don't care about any
      //ancestors above the configured node
      if (parent === this.getNode()) {
        break;
      }

      parent = parent.parentNode;
    }
    return true;
  },

  privates: {
    /**
     * Private method used to deeply retrieve the children of a record without recursion.
     * @private
     * @param {Ext.data.NodeInterface} root
     * @return {Ext.data.NodeInterface[]}
     */
    retrieveChildNodes: function (root) {
      var node = this.getNode(),
        recursive = this.getRecursive(),
        added = [],
        child = root;

      if (!root.childNodes.length || (!recursive && root !== node)) {
        return added;
      }

      if (!recursive) {
        return root.childNodes;
      }

      while (child) {
        if (child._added) {
          delete child._added;
          if (child === root) {
            break;
          } else {
            child = child.nextSibling || child.parentNode;
          }
        } else {
          if (child !== root) {
            added.push(child);
          }
          if (child.firstChild) {
            child._added = true;
            child = child.firstChild;
          } else {
            child = child.nextSibling || child.parentNode;
          }
        }
      }

      return added;
    }
  }
});
