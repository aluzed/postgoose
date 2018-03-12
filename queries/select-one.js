/**
* @module Queries/SelectOne
*
* @description Select a unique row in our postgres database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path         = require('path');
const Query        = require('./query');
const Promise      = require('bluebird');
const { GetModel } = require(path.join(__dirname, '..', 'model'));
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));

/**
* localErrors
*
* - paramTypeMismatch : Wrong type used in parameter
* - fieldNotFound : The field is missing in current Schema
* - fieldNotForeignKey : The field is not a foreign key
*/
const localErrors = {
  paramTypeMismatch  : 'Error, param type mismatch',
  fieldNotFound      : 'Error, field must exist in current schema',
  fieldNotForeignKey : 'Error, field is not a foreign key'
}

/**
 * Generate a select object to retreive data easily
 * 
 * @function Select
 * 
 * @param {String} table 
 * @param {Object} model 
 * @param {Object} options 
 * @return {Promise|Object}
 */
module.exports = (table, model, options) => {
  const schema = model.schema.paths;

  let populated     = {};

  let tmpQuery      = "SELECT ";
  let tmpConditions = "";
  let tmpGroupBy    = "";
  let tmpOrder      = "";
  let tmpLimit      = null;
  let tmpOffset     = null;
  let tmpLeftJoin   = null;

  // Hooks
  let preCallback   = null;
  let postCallback  = null;

  // Check if there is a pending condition
  let pendingCondition = false;

  // If there is no field specicied
  if(typeof options.fields === "undefined") {
    for(let field in schema) {
      tmpQuery += (tmpQuery === "SELECT ") ? (table.toLowerCase() + '.' + field) : (', ' + table.toLowerCase() + '.' + field);
    }
  }
  // Custom fields
  else {
    for(let field in options.fields) {
      tmpQuery += (tmpQuery === "SELECT ") ? (table.toLowerCase() + '.' + field) : (', ' + table.toLowerCase() + '.' + field);
    }
  }

  /**
  * @entry pendingCondition
  * @position before
  *
  * Pending Condition is a boolean that means a condition is waiting for its details.
  * It means that you already type : where(field)
  * The pendingCondition is automaticaly set while a where function is waiting for the rest.
  *
  * After a where(field) you will have a :
  * - between(a, b)
  * - notbetween(a, b)
  * - lt(number)
  * - gt(number)
  * - equals(val)
  * - in(array)
  */

  /**
  * @entry gt
  * @type Where Condition
  *
  * Greater than
  *
  * @param {Number} val
  * @return {Object} selectObject
  * @constraint pendingCondition**
  * @constraint val must be type of array
  * @throws {paramTypeMismatch}
  */
  function greater(val) {
    if(!pendingCondition)
      return;

    if(typeof val !== "Number")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' > ' + val;
    pendingCondition = false;

    return selectObject;
  }

  /**
  * @entry lt
  * @type Where Condition
  *
  * Lighter than
  *
  * @param {Number} val
  * @return {Object} selectObject
  * @constraint pendingCondition**
  * @constraint val must be type of Number
  * @throws {paramTypeMismatch}
  */
  function lighter(val) {
    if(!pendingCondition)
      return;

    if(typeof val !== "Number")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' < ' + val;
    pendingCondition = false;

    return selectObject;
  }

  /**
  * @entry in
  * @type Where Condition
  *
  * If the field has one of these values
  *
  * @param {Array} array
  * @return {Object} selectObject
  * @constraint pendingCondition**
  * @constraint array must be type of Array
  * @throws {paramTypeMismatch}
  */
  function isIn(array) {
    if(!pendingCondition)
      return;

    if(typeof array === "undefined")
      throw new Error(localErrors.paramTypeMismatch);

    if(typeof array.splice === "undefined")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += '(';

    for(let a in arr) {
      let tmpVal = arr[a];

      tmpConditions += `'${tmpVal}'`;

      // If there next value exists
      if(typeof arr[a + 1] !== "undefined")
        tmpConditions += ', ';
    }

    tmpConditions += ')';
    pendingCondition = false;

    return selectObject;
  }

  /**
  * @entry equals
  * @type Where Condition
  *
  * If the field has this value
  *
  * @param {Number|String} val
  * @return {Object} selectObject
  * @constraint pendingCondition**
  * @constraint val must be type of String or Number
  * @throws {paramTypeMismatch}
  */
  function equals(val) {
    if(!pendingCondition)
      return;

    if(typeof val !== "string" && typeof val !== "number")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' = "' + val + '"';
    pendingCondition = false;

    return selectObject;
  }

  /**
  * @entry between
  * @type Where Condition
  *
  * Get results between a and b for a given field
  *
  * @param {Number} a
  * @param {Number} b
  * @return {Object} selectObject
  * @constraint pendingCondition**
  * @constraint a must be type of Number
  * @constraint b must be type of Number
  * @throws {paramTypeMismatch}
  */
  function between(a, b) {
    if(!pendingCondition)
      return;

    if(typeof a !== "number" || typeof b !== "number")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' BETWEEN ' + a + ' AND ' + b;
    pendingCondition = false;

    return selectObject;
  }

  /**
  * @entry notbetween
  * @type Where Condition
  *
  * Get resulsts not between a and b for a given field
  *
  * @param {Number} a
  * @param {Number} b
  * @return {Object} selectObject
  * @constraint pendingCondition**
  * @constraint a must be type of Number
  * @constraint b must be type of Number
  * @throws {paramTypeMismatch}
  */
  function notbetween(a, b) {
    if(!pendingCondition)
      return;

    if(typeof a !== "number" || typeof b !== "number")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' NOT BETWEEN ' + a + ' AND ' + b;
    pendingCondition = false;

    return selectObject;
  }

  /**
  * @entry where
  * @type Select Function
  *
  * Start a new conditions or a group of conditions
  *
  * @param {Array|String} conditions|field
  * @return {Object} selectObject
  * @constraint must be type of Array or String
  * @throws {paramTypeMismatch}
  */
  function where(conditions) {
    // If conditions is type of array
    if(typeof conditions.splice !== "undefined") {
      for(let w in conditions) {
        tmpConditions += tmpConditions === "" ? conditions[w] : (" AND " + conditions[w]);
      }
      return selectObject;
    }
    if(typeof conditions === "string") {
      // If current path does not exist (the field is not in current model)
      if(typeof schema[conditions] === "undefined")
        return;

      tmpConditions += (tmpConditions === "") ? (table.toLowerCase() + '.' + conditions) : (" AND " + table.toLowerCase() + '.' + conditions);
      pendingCondition = true;

      return selectObject;
    }

    throw new Error(localErrors.paramTypeMismatch);
  }

  /**
  * @entry group
  * @type Select Function
  *
  * Group results
  *
  * @param {String} field
  * @return {Object} selectObject
  * @constraint field must be type of String
  * @constraint field must exist in current schema
  * @throws {paramTypeMismatch|fieldNotFound}
  */
  function group(field) {
    if(typeof field !== "string")
      throw new Error(localErrors.paramTypeMismatch);

    if(typeof schema[field] === "undefined")
      throw new Error(localErrors.fieldNotFound);

    tmpGroupBy = field;

    return selectObject;
  }

  /**
  * @entry sort
  * @type Select Function
  *
  * Sort results
  *
  * @param {Object} fields { fieldName: 'ASC', fieldName: 'DESC' }
  * @return {Object} selectObject
  * @constraint fields must be type of Object
  * @throws {paramTypeMismatch}
  */
  function sort(fields) {
    if(typeof fields === "undefined")
      throw new Error(localErrors.paramTypeMismatch);

    // Sanitize object : turn -1 and 1 to DESC and ASC
    for(let f in fields) {
      switch(fields[f]) {
        case -1 :
          fields[f] = 'DESC';
        break;
        case 1 :
          fields[f] = 'ASC';
        break;
      }
    }

    for(let f in fields) {
      tmpOrder += (tmpOrder === "") ? (f + ' ' + fields[f]) : (", " + f + ' ' + fields[f]);
    }

    return selectObject;
  }

  /**
  * @entry skip
  * @type Select Function
  *
  * Offset results
  *
  * @param {Number} val
  * @return {Object} selectObject
  * @constraint val must be type of Number
  * @throws {paramTypeMismatch}
  */
  function skip(val) {
    if(typeof val !== "number")
      throw new Error(localErrors.paramTypeMismatch);

    tmpOffset = val;

    return selectObject;
  }

  /**
  * @entry populate
  * @type Select Function
  *
  * Populate a foreign key
  *
  * @param {String} field
  * @return {Object} selectObject
  * @constraint field must be type of Id
  * @throws {fieldNotForeignKey}
  */
  function populate(field) {
    if (typeof populated[field] !== "undefined")
      return;

    let fk = schema[field];

    if (fk.type !== Types.Id)
      throw new Error(localErrors.fieldNotForeignKey);

    let foreignTable = fk.ref.toLowerCase();

    let model2 = GetModel(fk.ref);

    populated[field] = true;

    for (let f in model2.schema) {
      // Add Table.field
      tmpQuery += ", " + foreignTable + '.' + f;
    }

    tmpLeftJoin += " LEFT JOIN "(fk.ref + ' ON ' + foreignTable + '.id = ' + table.toLowerCase() + '.' + field);

    return selectObject;
  }

  /**
  * @entry skip
  * @type Select Function
  *
  * Execute the query, if there are hooks, execute them too.
  *
  * @param {Function} callback
  * @return {Promise}
  */
  function exec(callback) {
    // Forge query
    if(tmpLeftJoin !== null)
      tmpQuery += tmpLeftJoin + " ";

    if(tmpConditions !== "")
      tmpQuery += " WHERE " + tmpConditions;

    tmpQuery += " FROM " + table.toLowerCase();

    if(tmpGroupBy !== "")
      tmpQuery += " GROUP BY " + tmpGroupBy;

    if(tmpOrder !== "")
      tmpQuery += " ORDER " + tmpOrder;

    if(tmpLimit !== null)
      tmpQuery += " LIMIT " + tmpLimit;

    if(tmpOffset !== null)
      tmpQuery += " OFFSET " + tmpOffset;

    return new Promise((resolve, reject) => {
      if(preCallback !== null) {
        preCallback(resolve);
      }
      else resolve();
    }).then(() => {
      return new Promise((resolve, reject) => {
        const query = new Query();
        query.run(tmpQuery)
          .then(response => {
            
            // Turn response objects into models
            for(let r in response.results) {
              response.results[r] = new GetModel(table)(resposne.results[r]);
            }
            
            if(postCallback !== null) {
              postCallback(response.results);
            }

            !!callback ? callback(null, response.results) : resolve(response.results);
          })
          .catch(err => {
            !!callback ? callback(err) : reject(err);
          });
      });
    })

  }

  // Conditions
  if(!!options.where)
    where(options.where);

  if(!!options.order)
    sort(options.order);

  if(!!options.offset)
    skip(options.offset);

  const selectObject = {
    sort,
    order: sort, // Alias
    where,
    in: isIn,
    equals,
    between,
    notbetween,
    gt: greater,
    lt: lighter,
    skip,
    offset: skip, // Alias
    _pre: (cb) => {
      preCallback = cb;
    },
    _post: (cb) => {
      postCallback = cb;
    },
    populate,
    populated: () => Object.assign({}, populated),
    exec
  };

  return selectObject;
};
