/**
* @module Core/Model
*
* @description Postgresql Model Class
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path         = require('path');
const Promise      = require('bluebird');
const Insert       = require(path.join(__dirname, '..', 'queries', 'insert'));
const Update       = require(path.join(__dirname, '..', 'queries', 'update'));
const Remove       = require(path.join(__dirname, '..', 'queries', 'remove'));
const Select       = require(path.join(__dirname, '..', 'queries', 'select'));
const SelectOne    = require(path.join(__dirname, '..', 'queries', 'select-one'));
const Query        = require(path.join(__dirname, '..', 'queries', 'query'));
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));
const TableExists  = require(path.join(__dirname, '..', 'queries', 'table-exists'));
const CreateTable  = require(path.join(__dirname, '..', 'queries', 'create-table'));
const CheckColumns = require(path.join(__dirname, '..', 'queries', 'check-columns'));
const ModelCollection = require(path.join(__dirname, 'model-collection'));

/**
 * localErrors
 *
 * - ModelNotPersisted : model has not been persisted yet, so id column is missing.
 * - ModelAlreadyPersisted : model has already been persisted.
 * - ForbiddenColumnName : a column name is forbidden in schema definition.
 */
const localErrors = {
  ModelNotPersisted     : 'Error, model has not been persisted yet',
  ModelAlreadyPersisted : 'Error, model has already been persisted',
  ForbiddenColumnName   : 'Error, forbidden column name',
  SchemaPathsHasChanged : 'Error, schema paths has changed please delete the table to refresh it or use old schema'
};

const forbiddenColumns = [
  'schema',
  'save',
  'update',
  'remove'
];

/**
 * Create an Array of conditions from an object { key: value }
 *
 * @function _mapCriterias
 *
 * @param {Object} object
 * @return {Array} SQL conditions
  */
function _mapCriterias(object) {
  let tmpWhere = [];

  // Check special keywords
  for (let key in object) {
    let value = object[key];
    let matched = false;

    if (typeof value === "object") {
      for (let i in value) {
        switch (i) {
          case '$lt':
            tmpWhere.push(key + ' < ' + value[i]);
            break;
          case '$gt':
            tmpWhere.push(key + ' > ' + value[i]);
            break;
          case '$in':
            let newCondition = key + ' IN (';
            for (let val in value[i]) {
              newCondition += `'${value[i][val]}'`;

              // If has next value
              if (typeof value[i][val + 1] !== "undefined") {
                newCondition += ', ';
              }
            }
            newCondition += ')';

            tmpWhere.push(newCondition);
            break;
        }
      }
    }

    if (typeof value === "string" || typeof value === "number")
      tmpWhere.push(key + ' = ' + value);
  }

  return tmpWhere;
}

/**
 * Handles arguments and turn them into an object
 *
 * @function _sanitizeArguments
 *
 * @param {Spread} args
 * @return {Object} { fields, callback }
 */
function _sanitizeArguments(...args) {
  let fields = null;
  let order = null;
  let callback = null;

  for (let i in args) {
    // If this is a function, assign our callback
    if (typeof args[i] === 'function') {
      callback = args[i];
    }
    else {
      switch (i) {
        case 0:
          fields = args[0];
          break;
        case 1:
          if (typeof args[1].sort !== "undefied")
            order = args[1].sort;
          break;
      }
    }
  }

  return {
    fields,
    order,
    callback
  };
}

module.exports = (table, schema) => {

  let PostgooseModel = class {
    /**
    * PostgooseModel Constructor
    * @class PostgooseModel
    *
    * @param {Object} modelObject
    */
    constructor(modelObject) {
      this.id = null;

      this._schema = schema;
      this._table = table;

      // assign pre hooks
      if (!!this._schema.hooks.pre.init) {
        const val = this._schema.hooks.pre.init(this);
        for (let field in val) {
          this[field] = val[field];
        }
      }

      // assign  post hooks
      if (!!this._schema.hooks.post.init) {
        const val = this._schema.hooks.post.init(this);
        for (let field in val) {
          this[field] = val[field];
        }
      }

      // Fields
      for (let field in modelObject) {
        if (forbiddenColumns.indexOf(field) > -1)
          throw new Error(localErrors.ForbiddenColumnName);

        this[field] = modelObject[field];
      }

      // methods
      for (let i in schema.methods) {
        let method = schema.methods[i];

        if (typeof method === "function") {
          this[i] = method;
          this[i] = this[i].bind(this);
        }
      }

      // assign pre hooks
      if (!!schema.hooks.pre.init) {
        const val = schema.hooks.pre.init(this);
        for (let field in val) {
          this[field] = val[field];
        }
      }

      // assign  post hooks
      if (!!schema.hooks.post.init) {
        const val = schema.hooks.post.init(this);
        for (let field in val) {
          this[field] = val[field];
        }
      }
    }

    // Set deep object values
    _setValues(values) {
      for (let field in values) {
        this[field] = values[field];
      }
    }

    /**
     * Convert JS values to DB query format
     * @method valuesToDB
     *
     * @param {Object} object
     * @return {Object}
     */
    valuesToDB() {

    }

    /**
     * Convert DB values to JS format
     * @method valuesToJS
     *
     * @param {Object} object
     * @return {Object}
     */
    valuesToJS() {
      let newObject = {};

      for (let field in schema.paths) {
        let { instance } = schema.paths[field];

        newObject[field] = Types[instance].toJS(object[field]);
      }

      return newObject;
    }

    /**
     * Retreive data from our database
     *
     * @method find
     * @static
     *
     * @param {Object} criteria
     * @param {Spread} args fields, order, callback
     * @return {Error|QueryObject|Promise}
     */
    static find(criteria, ...args) {

      const conditions = _mapCriterias(criteria);

      const params = _sanitizeArguments(args);

      const callback = params.callback;

      let selectObject = Select(table, schema, {
        where: conditions,
        fields: params.fields,
        order: params.order
      });

      selectObject._pre(schema.hooks.pre.find);
      selectObject._post(schema.hooks.post.find);

      return new Promise((resolve, reject) => {
        return selectObject.exec().then(rows => {
          return (!!callback) ? callback(null, rows) : resolve(rows);
        })
        .catch(err => {
          return (!!callback) ? callback(err) : reject(err);
        });
      })
    }

    /**
     * Retreive one row from our database
     *
     * @method findOne
     * @static
     *
     * @param {Object} criteria
     * @param {Spread} args fields, order, callback
     * @return {Error|QueryObject|Promise}
     */
    static findOne(criteria, ...args) {

      const conditions = _mapCriterias(criteria);

      const params = _sanitizeArguments(args);

      const callback = params.callback;

      let selectOneObject = SelectOne(table, schema, {
        where: conditions,
        fields: params.fields
      });

      selectOneObject._pre(schema.hooks.pre.findOne);
      selectOneObject._post(schema.hooks.post.findOne);

      return new Promise((resolve, reject) => {
        return selectOneObject.exec().then(row => {
          return (!!callback) ? callback(null, row) : resolve(row);
        })
        .catch(err => {
          return (!!callback) ? callback(err) : reject(err);
        });
      })
    }

    /**
     * Retreive an item from our database
     *
     * @method findById
     * @static
     *
     * @param {Number} id
     * @param {Function} callback
     * @return {Error|QueryObject|Promise}
     */
     static findById(id, callback) {

       let selectOneObject = SelectOne(table, schema, {
        where: [
          table.toLowerCase() + '.id = ' + id
        ]
      });

      selectOneObject._pre(schema.hooks.pre.findById);
      selectOneObject._post(schema.hooks.post.findById);

      return new Promise((resolve, reject) => {
        return selectOneObject.exec().then(row => {
          return (!!callback) ? callback(null, row) : resolve(row);
        })
        .catch(err => {
          return (!!callback) ? callback(err) : reject(err);
        });
      })
    }

    /**
     * Retreive an item from our database and update it
     *
     * @method findByIdAndUpdate
     * @static
     *
     * @param {Number} id
     * @param {Object} newValues
     * @param {Function} callback
     */
    static findByIdAndUpdate(id, newValues, callback) {

      let query = SelectOne(table, schema, {
        where: [
          table + '.id = ' + id
        ]
      }).limit(1);

      return new Promise((resolve, reject) => {
        query.exec((err, item) => {
          if(err)
            return !!callback ? callback(err) : reject(err);
        });

        if(!!item) {
          item.update(newValues, callback)
            .then(item => {
              return !!callback ? callback(null, item) : resolve(item);
            })
            .catch(err => {
              return !!callback ? callback(err) : reject(err);
            })
        }

        !!callback ? callback(null, {}) : resolve();
      })
    }

    /**
     * Retreive an item from our database and remove it
     *
     * @method findByIdAndRemove
     * @static
     *
     * @param {Number} id
     * @param {Function} callback
     */
    static findByIdAndRemove(id, callback) {

      let query = SelectOne(table, schema, {
        where: [
          table + '.id = ' + id
        ]
      }).limit(1);

      return new Promise((resolve, reject) => {
        query.exec((err, item) =>  {
          if (err)
            return !!callback ? callback(err) : reject(err);
        });

        if (!!item) {
          item.remove(callback)
            .then(res => {
              return !!callback ? callback(null, res) : resolve(res);
            })
            .catch(err => {
              return !!callback ? callback(err) : reject(err);
            })
        }

        !!callback ? callback(null, {}) : resolve();
      })
    }

    /**
     * Create Method
     *
     * @method create
     *
     * @param {Function} callback
     * @constraint this.id must be undefined
     * @throws {ModelAlreadyPersisted}
     */
    static create(item, callback)  {
      let model = new this(item);

      let inserObj = Insert(table, model);

      inserObj._pre(schema.hooks.pre.create);
      inserObj._post(schema.hooks.post.create);

      return new Promise((resolve, reject) => {
        return inserObj.exec().then(row => {
          return (!!callback) ? callback(null, row) : resolve(row);
        })
        .catch(err => {
          return (!!callback) ? callback(err) : reject(err);
        });
      })
    }

    /**
     * RemoveAll Method
     * 
     * @method removeAll
     * 
     * @param {Object} criteria
     * @param {Function} callback 
     * @return {Error|QueryObject|Promise}
     */
    static removeAll(criteria, callback) {
      const conditions = _mapCriterias(criteria);

      const callback = params.callback;

      let removeAllObject = RemoveAll(table, {
        where: conditions,
        fields: params.fields,
        order: params.order
      });

      selectObject._pre(schema.hooks.pre.find);
      selectObject._post(schema.hooks.post.find);

      return new Promise((resolve, reject) => {
        return selectObject.exec().then(rows => {
          return (!!callback) ? callback(null, rows) : resolve(rows);
        })
          .catch(err => {
            return (!!callback) ? callback(err) : reject(err);
          });
      })
    }

    /**
     * updateAll Method
     * 
     * @method removeAll
     * 
     * @param {Object} criteria
     * @param {Function} callback 
     * @return {Error|QueryObject|Promise}
     */
    static updateAll(criteria, callback) {
      const conditions = _mapCriterias(criteria);


    }

    /**
     * Save Method
     *
     * @method save
     *
     * @param {Function} callback
     */
    save(callback) {
      const Self = this;

      let saveObj = null;

      if (!Self.id) {
        saveObj = Insert(table, Self);
      }
      else {
        saveObj = Update(table, Self);
      }

      saveObj._pre(schema.hooks.pre.save);
      saveObj._post(schema.hooks.post.save);


      return new Promise((resolve, reject) => {
        return saveObj.exec().then(row => {
          return (!!callback) ? callback(null, row) : resolve(row);
        })
          .catch(err => {
            return (!!callback) ? callback(err) : reject(err);
          });
      })
    }

    /**
     * Remove method
     *
     * @method remove
     *
     * @param {Function} callback
     * @constraint this.id must exist
     * @throws {ModelNotPersisted}
     */
    remove(callback) {
      const Self = this;

      if(typeof Self.id === "undefined")
        throw new Error(localErrors.ModelNotPersisted);

      return new Promise((resolve, reject) => {
        // If pre hook, exec the callback first
        if (!!Self._schema.hooks.pre.remove) {
          Self._schema.hooks.pre.remove(resolve);
        }
        else {
          // Or resolve
          resolve();
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          Remove(Self._table, this.id)
            .then(values => {
              Self._setValues(values);

              // If post hook
              if (!!Self._schema.hooks.post.remove) {
                Self._schema.hooks.post.remove(Self);
              }
              return !!callback ? callback(null, Self) : resolve(Self);
            })
            .catch(err => {
              return !!callback ? callback(err) : reject(err);
            });
        })
      });
    }

    /**
     * Update Method
     *
     * @method update
     *
     * @param {Object} newValues
     * @param {*} callback
     * @constraint this.id must exist
     * @throws {ModelNotPersisted}
     */
    update(newValues, callback) {
      const Self = this;

      if (typeof Self.id === "undefined")
        throw new Error(localErrors.ModelNotPersisted);

      return new Promise((resolve, reject) => {
        // If has pre hook, exec the callback first
        if (!!Self._schema.hooks.pre.update) {
          Self._schema.hooks.pre.update(resolve);
        }
        else {
          // Or resolve
          resolve();
        }
      })
      .then(() => {
        Update(Self._table, Self).then(values => {
          Self._setValues(values);

          // If there is a hook after save
          if (!!Self._schema.hooks.post.save)
            Self._schema.hooks.post.save(Self);

          return !!callback ? callback(null, Self) : resolve(Self);
        }).catch(err => {
          return !!callback ? callback(err) : reject(err);
        });
      })
    }
  }

  // Check if table exists
  TableExists(table).then(tableExists => {
    if (!tableExists)
      CreateTable(table, schema.paths);
    else {
      CheckColumns(table, schema.paths)
        .then(schemaChanged => {
          if (schemaChanged.changed === true)
            throw new Error(localErrors.SchemaPathsHasChanged);
        })
    }
  });

  // Bind static methods
  for (let i in schema.statics) {
    PostgooseModel[i] = schema.statics[i];
  }

  // Add new model in model collection
  return ModelCollection.SetModel(table, PostgooseModel);
};
