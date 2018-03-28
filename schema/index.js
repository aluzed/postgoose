/**
* @module Core/PostgooseSchema
*
* @description Schema class and definition
*
* @copyright 2018
* @author Alexandre PENOMBRE <aluzed_AT_gmail.com>
*/
const SchemaPath = require('./schema-path');
const _Types     = require('./types');
const _HooksList = require('./hooks-list');

/**
* localErrors
*
* - UndefinedType : The type does not exist in PostgooseSchema.Types
* - UnknownHookType : The hook type does not exist in allowed hooksList
* - BadTypeFormat : schema type must be type of ...
*/
const localErrors = {
  UndefinedType   : 'Error, undefined type',
  UnknownHookType : 'Error, unknown hook type',
  BadTypeFormat   : 'Error, bad schema type'
};

/**
 * Convert a field to a schema path (like in mongoose :-P)
 *
 * @function fieldToPath
 * @ignore
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

const PostgooseSchema = class {
  /**
   * Schema Constructor
   * - constraint : each field type must exist in Postgoose.Schema.Types
   *
   * @constructor PostgooseSchema
   *
   * @param {Object} schema
   */
  constructor(schema) {
    this.paths = {};

    this.hooks = {
      pre: _HooksList.reduce((acc, cur) => {
        return Object.assign(acc, { [cur]: null });
      }, {}),
      post: _HooksList.reduce((acc, cur) => {
        return Object.assign(acc, { [cur]: null });
      }, {})
    };

    // Get a sanitized path for each field
    for (let field in schema) {
      this.paths[field] = fieldToPath(field, schema[field]);
    }

    this.methods = {};

    this.statics = {};
  }

  /**
   * Bind a pre hook to our schema
   * - constraint : hookType must be an allowed hook
   *
   * @function pre
   *
   * @param {String} hookType
   * @param {Function} callback
   * @throws {UnknownHookType}
   */
  pre(hookType, callback) {
    // Check if hookType exists
    if (_HooksList.indexOf(hookType) < 0)
      throw new Error(localErrors.UnknownHookType);

    this.hooks.pre[hookType] = callback;
  }

  /**
   * Bind a post hook to our schema
   * - constraint : hookType must be an allowed hook
   *
   * @function post
   *
   * @param {String} hookType
   * @param {Function} callback
   * @throws {UnknownHookType}
   */
  post(hookType, callback) {
    // Check if hookType exists
    if (_HooksList.indexOf(hookType) < 0)
      throw new Error(localErrors.UnknownHookType);

    this.hooks.post[hookType] = callback;
  }

  /**
   * Return the list of available types
   *
   * @function Types
   * @static
   *
   * @return {Object}
   */
  static get Types() {
    return _Types;
  }
}

module.exports = {
  Schema       : PostgooseSchema,
  SchemaErrors : localErrors
};
