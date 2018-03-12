/**
* @module Core/PostgooseSchema
*
* @description Schema class and definition
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const SchemaPath = require('./schema-path');
const _Types     = require('./types');
const _HooksList = require('./hooks-list');

/**
* localErrors
*
* - UndefinedType : The type does not exist in PostgooseSchema.Types
* - UnknownHookType : The hook type does not exist in allowed hooksList
*/
const localErrors = {
  UndefinedType   : 'Error, undefined type',
  UnknownHookType : 'Error, unknown hook type',
  BadTypeFormat   : 'Error, schema type must be type of function'
};

/**
 * Convert a field to a path
 *
 * @function fieldToPath
 *
 * @param {Object} field
 * @return {Object} path
  */
function fieldToPath(name, field) {
  let tmpPath = Object.assign({}, SchemaPath);

  // Check if the type exists in Types
  if(typeof field.type !== "undefined") {
    if(typeof field.type !== "function") 
      throw new Error(localErrors.BadTypeFormat);

    if (typeof _Types[field.type.name] === "undefined")
      throw new Error(localErrors.UndefinedType);

    tmpPath = Object.assign(tmpPath, {
      instance : field.type.name,
      path     : name
    });

    if(typeof field.default !== "undefined")
      tmpPath.defaultValue = field.default;

    if(typeof field.enum !== "undefined")
      tmpPath.enumValues = field.enum;

    if(typeof field.validate !== "undefined") {
      for(let v in field.validate) {
        // each item = { validator:(v)=>{...}, message: '...' }
        tmpPath.validators.push(field.validate[v]);
      }
    }

    // required
    if (!!field.required) {
      tmpPath.required = true;
      tmpPath.validators.push({
        validator: (v) => {
          return typeof v !== "undefined";
        },
        message: `${field} is marqued as required but missing.`
      })
    }

    // indexs
    if(typeof field.index !== "undefined") {
      if(!!field.index.unique) {
        tmpPath.unique = true;
      }
    }
  }
  else {
    if(typeof field !== "function") 
      throw new Error(localErrors.BadTypeFormat);

    if (typeof _Types[tmpType] === "undefined") 
      throw new Error(localErrors.UndefinedType);

    tmpPath = Object.assign(tmpPath, {
      instance : field.name,
      path     : name
    });
  }

  return tmpPath;
}


module.exports = {
  Schema: class PostgooseSchema {
    /**
     * Schema Constructor
     *
     * @constructor PostgooseSchema
     *
     * @param {Object} schema
     * @constraint each field type must exist in Postgoose.SChema.Types
     */
    constructor(schema) {
      this.paths = {};

      this.hooks = {
        pre  : Object.assign({}, _HooksList),
        post : Object.assign({}, _HooksList)
      };

      // Get a sanitized path for each field
      for(let field in schema) {
        this.paths[field] = fieldToPath(field, schema[field]);
      }

      this.methods = {};

      this.statics = {};
    }

    /**
     * Bind a pre hook to our schema
     *
     * @function pre
     *
     * @param {String} hookType
     * @param {Function} callback
     * @constraint hookType must be an allowed hook
     * @throws {UnknownHookType}
     */
    pre(hookType, callback) {
      // Check if hookType exists
      if(typeof _HooksList[hookType] === "undefined")
        throw new Error(localErrors.UnknownHookType);

      this.hooks.pre[hookType] = callback;
    }

    /**
    * @function post
    *
    * Bind a post hook to our schema
    *
    * @param {String} hookType
    * @param {Function} callback
    * @constraint hookType must be an allowed hook
    * @throws {UnknownHookType}
    */
    post(hookType, callback) {
      // Check if hookType exists
      if(typeof _HooksList[hookType] === "undefined")
        throw new Error(localErrors.UnknownHookType);

      this.hooks.post[hookType] = callback;
    }

    /**
    * @entry Types
    * @type Static Method
    *
    * Return the list of available types
    *
    * @return {Object}
    */
    static get Types() {
      return _Types;
    }
  },
  SchemaErrors: localErrors
};
