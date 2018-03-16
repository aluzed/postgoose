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
  ItemNotFound          : 'Error, item not found',
  ForbiddenColumnName   : 'Error, forbidden column name',
  SchemaPathsHasChanged : 'Error, schema paths has changed please delete the table to refresh it or use old schema',
  BadCallbackFormat     : 'Error bad callback format'
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
            tmpWhere.push(key + ' < ' + "'" + value[i]) + "'";
            break;
          case '$gt':
            tmpWhere.push(key + ' > ' + "'" + value[i]) + "'";
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
    else {
      if(key.match(/\slike$/)) {
        tmpWhere.push(key.split(' ')[0] + ' LIKE ' + "'" + value + "'");
      }
      else if(key.match(/\silike$/)) {
        tmpWhere.push('LOWER(' + key.split(' ')[0] + ') LIKE LOWER(' + "'" + value + "')");
      }
      else if(key.match(/\s\>$/)) {
        tmpWhere.push(key.split(' ')[0] + ' > ' + value);
      }
      else if(key.match(/\s\<$/)) {
        tmpWhere.push(key.split(' ')[0] + ' < ' + value);
      }
      else if(key.match(/\s\>\=$/)) {
        tmpWhere.push(key.split(' ')[0] + ' >= ' + value);
      }
      else if(key.match(/\s\<\=$/)) {
        tmpWhere.push(key.split(' ')[0] + ' <= ' + value);
      }
      else if(key.match(/\s\<\>$/)) {
        tmpWhere.push(key.split(' ')[0] + ' <> ' + "'" + value + "'");
      }
      else if(key.match(/\s\!\=$/)) {
        tmpWhere.push(key.split(' ')[0] + ' != ' + "'" + value + "'");
      }
      else {
        tmpWhere.push(key + ' = ' + value);
      }
    }
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
function _sanitizeArguments(args) {
  args = args || [];

  let fields = null;
  let order = null;
  let callback = null;

  switch(args.length) {
    case 1: 
      if(typeof args[0] === "function")
        callback = args[0];
      else 
        fields = args[0];
    break;

    case 2:
      fields = args[0];

      if(typeof args[1] === "function") 
        callback = args[1];
      else 
        order = args[1];
    break;

    case 3:
      fields = args[0]
      order = args[1];

      if(typeof args[2] === "function")
        callback = args[2];
      else 
        throw new Error(localErrors.BadCallbackFormat);
    break;
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

      const cb = params.callback;

      let selectObject = Select(table, schema, {
        where: conditions,
        fields: params.fields,
        order: params.order
      });

      selectObject._pre(schema.hooks.pre.find);
      selectObject._post(schema.hooks.post.find);

      return new Promise((resolve, reject) => {
        return selectObject.exec().then(rows => {
          return (!!cb) ? cb(null, rows) : resolve(rows);
        })
        .catch(err => {
          return (!!cb) ? cb(err) : reject(err);
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

      const cb = params.callback;

      let selectOneObject = SelectOne(table, schema, {
        where: conditions,
        fields: params.fields
      });

      selectOneObject._pre(schema.hooks.pre.findOne);
      selectOneObject._post(schema.hooks.post.findOne);

      return new Promise((resolve, reject) => {
        return selectOneObject.exec().then(row => {
          return (!!cb) ? cb(null, row) : resolve(row);
        })
        .catch(err => {
          return (!!cb) ? cb(err) : reject(err);
        });
      })
    }

    /**
     * Retreive an item from our database
     *
     * @method findById
     * @static
     *
     * @param {Number} id item ID
     * @param {Function} cb Callback
     * @return {Error|QueryObject|Promise}
     */
    static findById(id, cb) {

      let selectOneObject = SelectOne(table, schema, {
        where: [
          table.toLowerCase() + '.id = ' + id
        ]
      });

      selectOneObject._pre(schema.hooks.pre.findById);
      selectOneObject._post(schema.hooks.post.findById);

      return new Promise((resolve, reject) => {
        return selectOneObject.exec().then(row => {
          return (!!cb) ? cb(null, row) : resolve(row);
        })
        .catch(err => {
          return (!!cb) ? cb(err) : reject(err);
        });
      })
    }

    /**
     * Retreive an item from our database and update it
     *
     * @method findByIdAndUpdate
     * @static
     *
     * @param {Number} id item ID
     * @param {Object} newValues Values
     * @param {Function} cb Callback
     */
    static findByIdAndUpdate(id, newValues, cb) {

      const Self = this;

      return new Promise((resolve, reject) => {
        Self
          .findById(id).then(item => {
            if(!item)
              return !!cb ? cb(new Error(localErrors.ItemNotFound)) : reject(new Error(localErrors.ItemNotFound));

            for (let key in newValues) {
              item[key] = newValues[key];
            }

            let updateObj = Update(table, item);

            updateObj._pre(schema.hooks.pre.findByIdAndUpdate);
            updateObj._post(schema.hooks.post.findByIdAndUpdate);

            return new Promise((resolve, reject) => {
              return updateObj.exec().then(row => {
                return (!!cb) ? cb(null, row) : resolve(row);
              })
                .catch(err => {
                  return (!!cb) ? cb(err) : reject(err);
                });
            });
            
            return item.update(newValues, cb);
          })
          .catch(err => {
            return !!cb ? cb(err) : reject(err);
          })
      });
    }

    /**
     * Retreive an item from our database and remove it
     *
     * @method findByIdAndRemove
     * @static
     *
     * @param {Number} id
     * @param {Function} cb
     */
    static findByIdAndRemove(id, cb) {
      const Self = this;

      return new Promise((resolve, reject) => {
        Self
          .findById(id).then(item => {
            if (!item)
              return !!cb ? cb(new Error(localErrors.ItemNotFound)) : reject(new Error(localErrors.ItemNotFound));

            let removeObj = Remove(table, item);

            removeObj._pre(schema.hooks.pre.findByIdAndRemove);
            removeObj._post(schema.hooks.post.findByIdAndRemove);

            return new Promise((resolve, reject) => {
              return removeObj.exec().then(row => {
                return (!!cb) ? cb(null, row) : resolve(row);
              })
                .catch(err => {
                  return (!!cb) ? cb(err) : reject(err);
                });
            });

            return item.update(newValues, cb);
          })
          .catch(err => {
            return !!cb ? cb(err) : reject(err);
          })
      });
    }

    /**
     * Create Method
     *
     * @method create
     *
     * @param {Object} item Values
     * @param {Function} cb Callback
     * @constraint this.id must be undefined
     * @throws {ModelAlreadyPersisted}
     */
    static create(item, cb)  {
      let model = new this(item);

      let inserObj = Insert(table, model);

      inserObj._pre(schema.hooks.pre.create);
      inserObj._post(schema.hooks.post.create);

      return new Promise((resolve, reject) => {
        return inserObj.exec().then(row => {
          return (!!cb) ? cb(null, row) : resolve(row);
        })
        .catch(err => {
          return (!!cb) ? cb(err) : reject(err);
        });
      })
    }

    /**
     * RemoveAll Method
     * 
     * @method removeAll
     * 
     * @param {Object} criteria
     * @param {Function} cb 
     * @return {Error|QueryObject|Promise}
     */
    static removeAll(criteria, cb) {
      const conditions = _mapCriterias(criteria);

      let removeAllObject = RemoveAll(table, {
        where: conditions,
        fields: params.fields,
        order: params.order
      });

      selectObject._pre(schema.hooks.pre.find);
      selectObject._post(schema.hooks.post.find);

      return new Promise((resolve, reject) => {
        return selectObject.exec().then(rows => {
          return (!!cb) ? cb(null, rows) : resolve(rows);
        })
          .catch(err => {
            return (!!cb) ? cb(err) : reject(err);
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
     * @param {Function} cb Callback
     */
    save(cb) {
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
          return (!!cb) ? cb(null, row) : resolve(row);
        })
          .catch(err => {
            return (!!cb) ? cb(err) : reject(err);
          });
      })
    }

    /**
     * Remove method
     *
     * @method remove
     *
     * @param {Function} cb Callback
     * @constraint this.id must exist
     * @throws {ModelNotPersisted}
     */
    remove(cb) {
      const Self = this;

      if(typeof Self.id === "undefined")
        throw new Error(localErrors.ModelNotPersisted);

      let removeObj = Remove(table, Self);

      removeObj._pre(schema.hooks.pre.remove);
      removeObj._post(schema.hooks.post.remove);


      return new Promise((resolve, reject) => {
        return removeObj.exec().then(row => {
          return (!!cb) ? cb(null, row) : resolve(row);
        })
          .catch(err => {
            return (!!cb) ? cb(err) : reject(err);
          });
      })
    }

    /**
     * Update Method
     *
     * @method update
     *
     * @param {Object} newValues
     * @param {*} cb Callback
     * @constraint this.id must exist
     * @throws {ModelNotPersisted}
     */
    update(newValues, cb) {
      const Self = this;

      if (!Self.id)
        throw new Error(localErrors.ModelNotPersisted);

      for(let key in newValues) {
        Self[key] = newValues[key];
      }

      let updateObj = Update(table, Self);

      updateObj._pre(schema.hooks.pre.update);
      updateObj._post(schema.hooks.post.update);

      return new Promise((resolve, reject) => {
        return updateObj.exec().then(row => {
          return (!!cb) ? cb(null, row) : resolve(row);
        })
          .catch(err => {
            return (!!cb) ? cb(err) : reject(err);
          });
      });
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
