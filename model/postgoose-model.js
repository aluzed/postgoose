/**
* @module Core
* @resource Model
*
* Postgresql Model Class
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const Insert       = require('../queries/insert');
const Update       = require('../queries/update');
const Remove       = require('../queries/remove');
const Select       = require('../queries/select');
const Query        = require('../queries/query');
const Promise      = require('bluebird');
const path         = require('path');
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));
const TableExists  = require(path.join(__dirname, '..', 'queries', 'table-exists'));
const CreateTable  = require(path.join(__dirname, '..', 'queries', 'create-table'));
const CheckColumns = require(path.join(__dirname, '..', 'queries', 'check-columns'));

/**
 * @entry localErrors
 * @position before
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

module.exports = (table, schema) => {

  let tmpClass = class PostgooseModel {
    /**
    * @entry PostgooseModel
    * @type Class
    *
    * PostgooseModel Constructor
    *
    * @param {Object} modelObject
    */
    constructor(modelObject) {
      this.id = null;
      this.__proto__.schema = schema;
      this.__proto__.table = table;

      this.__proto__._setValues = (values) => {
        for (let field in values) {
          this[field] = values[field];
        }
      };

      // assign pre hooks
      if (!!this.__proto__.schema.hooks.pre.init) {
        const val = this.__proto__.schema.hooks.pre.init(this);
        for (let field in val) {
          this[field] = val[field];
        }
      }

      // assign  post hooks
      if (!!this.__proto__.schema.hooks.post.init) {
        const val = this.__proto__.schema.hooks.post.init(this);
        for (let field in val) {
          this[field] = val[field];
        }
      }

      // Fields
      for (let field in modelObject) {
        if(field === 'schema')
          throw new Error(localErrors.ForbiddenColumnName);

        this[field] = modelObject[field];
      }

      // methods
      for (let i in schema.methods) {
        let method = schema.methods[i];

        if(typeof method === "function") {
          this[i] = method;
          this[i] = this[i].bind(this);
        }
      }

      // Check if table exists
      TableExists(table).then(tableExists => {
        if(!tableExists)
          CreateTable(table, this.__proto__.schema.paths);
        else {
          CheckColumns(table, this.__proto__.schema.paths)
            .then(schemaChanged => {
              if(schemaChanged.changed === true)
                throw new Error(localErrors.SchemaPathsHasChanged);
            })
        }
      });
    }

    valuesToDB() {

    }

    /**
     * @entry valuesToJS
     * @type Method
     * 
     * Convert DB values to JS format
     * 
     * @param {Object} object 
     * @return {Object}
     */
    valuesToJS(object) {
      let newObject = {};

      for(let field in object) {
        let { instance } = this.__proto__.schema.paths[field];

        newObject[field] = Types[instance].toJS(object[field]);
      }

      return newObject;
    }

    /**
    * @entry _mapCriterias
    * @type Private Method
    *
    * Create an Array of conditions from an object { key: value }
    *
    * @param {Object} object
    * @return {Array} SQL conditions
    */
    _mapCriterias(object) {
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
                  if (typeof value[i][val + 1] !== "undefined")  {
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
    * @entry _sanitizeArguments
    * @type Private Method
    *
    * Handles arguments and turn them into an object
    *
    * @param {Spread} args
    * @return {Object} { fields, callback }
    */
    _sanitizeArguments(...args) {
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

    /**
    * @entry find
    * @type Static Method
    *
    * Retreive data from our database
    *
    * @param {Object} criteria
    * @param {Spread} args fields, order, callback
    * @return {Error|QueryObject|Promise}
    */
    static find(criteria, ...args) {
      const Self = this;

      const conditions = Self._mapCriterias(criteria);

      const params = Self._sanitizeArguments(args);

      const callback = params.callback;

      let query = Select(Self.__proto__.table, Self, {
        where: conditions,
        fields: params.fields,
        order: params.order
      });

      if (!!callback)
        query.exec(callback);
      else
        return query;
    }

    /**
    * @entry findOne
    * @type Static Method
    *
    * Retreive one row from our database
    *
    * @param {Object} criteria
    * @param {Spread} args fields, order, callback
    * @return {Error|QueryObject|Promise}
    */
    static findOne(criteria, ...args) {
      const Self = this;

      const conditions = Self._mapCriterias(criteria);

      const params = Self._sanitizeArguments(args);

      const callback = params.callback;

      let query = Select(Self.__proto__.table, Self, {
        where: conditions,
        fields: params.fields
      }).limit(1);

      // Bind hooks
      if (!!Self.__proto__.schema.hooks.pre.findOne)
        query._pre(Self.__proto__.schema.hooks.pre.findOne);

      if (!!Self.__proto__.schema.hooks.post.findOne)
        query._post(Self.__proto__.schema.hooks.post.findOne);

      if (!!callback)
        query.exec(callback);
      else
        return query;
    }

    /**
    * @entry findById
    * @type Static Method
    *
    * Retreive an item from our database
    *
    * @param {Number} id
    * @param {Function} callback
    * @return {Error|QueryObject|Promise}
    */
    static findById(id, callback) {
      const Self = this;

      let query = Select(Self.__proto__.table, Self, {
        where: [
          Self.__proto__.table + '.id = ' + id
        ]
      }).limit(1);

      // Bind hooks
      if (!!Self.__proto__.schema.hooks.pre.findById)
        query._pre(Self.__proto__.schema.hooks.pre.findById);

      if (!!Self.__proto__.schema.hooks.post.findById)
        query._post(Self.__proto__.schema.hooks.post.findById);

      if (!!callback)
        query.exec(callback);
      else
        return query;
    }

    /**
     * @entry findByIdAndUpdate
     * @type Static Method
     * 
     * Retreive an item from our database and update it
     * 
     * @param {Number} id 
     * @param {Object} newValues
     * @param {Function} callback 
     */
    static findByIdAndUpdate(id, newValues, callback) {
      const Self = this;

      let query = Select(Self.__proto__.table, Self, {
        where: [
          Self.__proto__.table + '.id = ' + id
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
     * @entry findByIdAndRemove
     * @type Static Method
     * 
     * Retreive an item from our database and remove it
     * 
     * @param {Number} id 
     * @param {Function} callback 
     */
    static findByIdAndRemove(id, callback) {
      const Self = this;

      let query = Select(Self.__proto__.table, Self, {
        where: [
          Self.__proto__.table + '.id = ' + id
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
     * @entry create
     * @type Method
     * 
     * Create Method
     * 
     * @param {Function} callback 
     * @constraint this.id must be undefined
     * @throws {ModelAlreadyPersisted}
     */
    create(callback)  {
      const Self = this;

      if (typeof Self.id !== "undefined")
        throw new Error(localErrors.ModelAlreadyPersisted);

      if (!Self.id)
        throw new Error(localErrors.ItemExists);

      return new Promise((resolve, reject) => {
        // If has pre hook, exec the callback first
        if (!!Self.__proto__.schema.hooks.pre.create) {
          Self.__proto__.schema.hooks.pre.create(resolve);
        }
        else {
          // Or resolve
          resolve();
        }
      })
        .then(() => {
          return new Promise((resolve, reject) => {
            Insert(Self.__proto__.table, this).then(item => {
              // If there is a hook after save
              if (!!this.__proto__.schema.hooks.post.create)
                this.__proto__.schema.hooks.post.create(item);

              return (!!callback) ? callback(null, item) : resolve(item);
            })
              .catch(err => {
                return (!!callback) ? callback(err) : reject(err);
              })
          });
        });
    }

    /**
     * @entry save
     * @type Method
     * 
     * Save Method
     * 
     * @param {Function} callback 
     */
    save(callback) {
      const Self = this;

      return new Promise((resolve, reject) => {
        // If has pre hook, exec the callback first
        if (!!Self.__proto__.schema.hooks.pre.save) {
          Self.__proto__.schema.hooks.pre.save(resolve);
        }
        else {
          // Or resolve
          resolve();
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          // Insert Case
          if (!Self.id) {
            Insert(Self.__proto__.table, this).then(values => {
              Self.__proto__._setValues(values);

              // If there is a hook after save
              if (!!Self.__proto__.schema.hooks.post.save)
                Self.__proto__.schema.hooks.post.save(Self);

              return !!callback ? callback(null, Self) : resolve(Self);
            }).catch(err => {
              return !!callback ? callback(err) : reject(err);
            });
          }
          // Update Case
          else {
            Update(Self.__proto__.table, Self).then(values => {
              Self.__proto__._setValues(values);

              // If there is a hook after save
              if (!!Self.__proto__.schema.hooks.post.save)
                Self.__proto__.schema.hooks.post.save(Self);

              return !!callback ? callback(null, Self) : resolve(Self);
            }).catch(err => {
              return !!callback ? callback(err) : reject(err);
            });
          }
        })
      });
    }

    /**
     * @entry remove
     * @type Method
     * 
     * Remove method
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
        if (!!Self.__proto__.schema.hooks.pre.remove) {
          Self.__proto__.schema.hooks.pre.remove(resolve);
        }
        else {
          // Or resolve
          resolve();
        }
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          Remove(Self.__proto__.table, this.id)
            .then(values => {
              Self.__proto__._setValues(values);

              // If post hook
              if (!!Self.__proto__.schema.hooks.post.remove) {
                Self.__proto__.schema.hooks.post.remove(Self);
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
     * @entry update
     * @type Method
     * 
     * Update Method
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
        if (!!Self.__proto__.schema.hooks.pre.update) {
          Self.__proto__.schema.hooks.pre.update(resolve);
        }
        else {
          // Or resolve
          resolve();
        }
      })
      .then(() => {
        Update(Self.__proto__.table, Self).then(values => {
          Self.__proto__._setValues(values);

          // If there is a hook after save
          if (!!Self.__proto__.schema.hooks.post.save)
            Self.__proto__.schema.hooks.post.save(Self);

          return !!callback ? callback(null, Self) : resolve(Self);
        }).catch(err => {
          return !!callback ? callback(err) : reject(err);
        });
      })
    }
  }

  // Bind static methods
  for (let i in schema.statics) {
    tmpClass.__proto__[i] = schema.statics[i];
  }

  return tmpClass;
};