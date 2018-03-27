/**
* @module Queries/Select
*
* @description Select data in our postgres database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path         = require('path');
const Query        = require('./query');
const Promise      = require('bluebird');
const { GetModel } = require(path.join(__dirname, '..', 'model', 'model-collection'));
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
* @param {Object} schemaObject
* @param {Object} options
* @return {Promise} Bluebird Promise
*/
module.exports = (table, schemaObject, options) => {
  const schema = schemaObject.paths;

  let populated     = {};

  let tmpQuery      = "SELECT " + table.toLowerCase() + ".id, ";
  let tmpConditions = "";
  let tmpGroupBy    = "";
  let tmpOrder      = "";
  let tmpLimit      = null;
  let tmpOffset     = null;
  let tmpLeftJoin   = null;

  let preCallback = null;
  let postCallback = null;

  // Check if there is a pending condition
  let pendingCondition = false;

  // If there is no field specicied
  if (!options.fields) {
    for(let field in schema) {
      tmpQuery += (tmpQuery === "SELECT " + table.toLowerCase() + ".id, ") ? (table.toLowerCase() + '.' + field) : (', ' + table.toLowerCase() + '.' + field);
    }
  }
  // Custom fields
  else {
    for(let field in options.fields) {
      tmpQuery += (tmpQuery === "SELECT " + table.toLowerCase() + ".id, ") ? (table.toLowerCase() + '.' + field) : (', ' + table.toLowerCase() + '.' + field);
    }
  }

  /**
  * @description pendingCondition
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
   * Greater than
   * - constraint pendingCondition
   * - constraint val must be type of array
   *
  * @function gt
  *
  * @param {Number} val
  * @return {Object} selectObject
  * @throws {paramTypeMismatch}
  */
  function greater(val) {
    if(!pendingCondition)
    return;

    if(typeof val !== "Number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' > ' + val;
    pendingCondition = false;

    return this;
  }

  /**
   * Lighter than
   * - constraint pendingCondition
   * - constraint val must be type of Number
   *
  * @function lt
  *
  * @param {Number} val
  * @return {Object} selectObject
  * @throws {paramTypeMismatch}
  */
  function lighter(val) {
    if(!pendingCondition)
    return;

    if(typeof val !== "Number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' < ' + val;
    pendingCondition = false;

    return this;
  }

  /**
   * If the field has one of these values
   * - constraint pendingCondition
   * - constraint array must be type of Array
   *
  * @function in
  *
  * @param {Array} array
  * @return {Object} selectObject
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

    return this;
  }

  /**
   * If the field has this value
   * - constraint pendingCondition
   * - constraint val must be type of String or Number
   *
   * @function equals
   *
   * @param {Number|String} val
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function equals(val) {
    if(!pendingCondition)
    return;

    if(typeof val !== "string" && typeof val !== "number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' = "' + val + '"';
    pendingCondition = false;

    return this;
  }

  /**
   * Get results between a and b for a given field
   * - constraint pendingCondition
   * - constraint a must be type of Number
   * - constraint b must be type of Number
   *
   * @function between
   *
   * @param {Number} a
   * @param {Number} b
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function between(a, b) {
    if(!pendingCondition)
    return;

    if(typeof a !== "number" || typeof b !== "number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' BETWEEN ' + a + ' AND ' + b;
    pendingCondition = false;

    return this;
  }

  /**
   * Get results not between a and b for a given field
   * - constraint pendingCondition
   * - constraint a must be type of Number
   * - constraint b must be type of Number
   *
   * @function notbetween
   *
   * @param {Number} a
   * @param {Number} b
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function notbetween(a, b) {
    if(!pendingCondition)
    return;

    if(typeof a !== "number" || typeof b !== "number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += ' NOT BETWEEN ' + a + ' AND ' + b;
    pendingCondition = false;

    return this;
  }

  /**
   * Start a new conditions or a group of conditions
   * - constraint must be type of Array or String
   *
   * @function where
   *
   * @param {Array|String} conditions|field
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function where(conditions) {
    // If conditions is type of array
    if(typeof conditions.splice !== "undefined") {
      for(let w in conditions) {
        tmpConditions += tmpConditions === "" ? conditions[w] : (" AND " + conditions[w]);
      }
      return this;
    }
    if(typeof conditions === "string") {
      // If current path does not exist (the field is not in current model)
      if(typeof schema[conditions] === "undefined")
      return;

      tmpConditions += (tmpConditions === "") ? 
        (table.toLowerCase() + '.' + conditions) : 
        (" AND " + table.toLowerCase() + '.' + conditions);
      pendingCondition = true;

      return this;
    }

    throw new Error(localErrors.paramTypeMismatch);
  }

  /**
   * Group results
   * - constraint field must be type of String
   * - constraint field must exist in current schema
   *
  * @function group
  *
  * @param {String} field
  * @return {Object} selectObject
  * @throws {paramTypeMismatch|fieldNotFound}
  */
  function group(field) {
    if(typeof field !== "string")
    throw new Error(localErrors.paramTypeMismatch);

    if(typeof schema[field] === "undefined")
    throw new Error(localErrors.fieldNotFound);

    tmpGroupBy = field;

    return this;
  }

  /**
   * Sort results
   * - constraint fields must be type of Object
   *
  * @function sort
  *
  * @param {Object} fields { fieldName: 'ASC', fieldName: 'DESC' }
  * @return {Object} selectObject
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

    return this;
  }

  /**
   * Limit results
   * - constraint val must be type of Number
   *
   * @function limit
   *
   * @param {Number} val
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function limit(val) {
    if(typeof val !== "number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpLimit = val;

    return this;
  }

  /**
   * Offset results
   * - constraint val must be type of Number
   * 
   * @function skip
   *
   * @param {Number} val
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function skip(val) {
    if(typeof val !== "number")
    throw new Error(localErrors.paramTypeMismatch);

    tmpOffset = val;

    return this;
  }

  /**
   * Populate a foreign key
   * - constraint field must be type of Id
   *
   * @function populate
   *
   * @param {String} field
   * @return {Object} selectObject
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

    return this;
  }

  /**
  * Execute the query, if there are hooks, execute them too.
  *
  * @function exec
  *
  * @return {Promise} Bluebird Promise
  */
  function exec() {
    // Forge query
    tmpQuery += " FROM " + table.toLowerCase();
    
    if(tmpLeftJoin !== null)
    tmpQuery += tmpLeftJoin + " ";

    if (tmpConditions !== "")
      tmpQuery += " WHERE " + tmpConditions;

    if(tmpGroupBy !== "")
    tmpQuery += " GROUP BY " + tmpGroupBy;

    if(tmpOrder !== "")
    tmpQuery += " ORDER " + tmpOrder;

    if(tmpLimit !== null)
    tmpQuery += " LIMIT " + tmpLimit;

    if(tmpOffset !== null)
    tmpQuery += " OFFSET " + tmpOffset;

    return new Promise((resolve, reject) => {

      return new Promise((res, rej) => {
        if(!!preCallback) {
          preCallback = preCallback.bind(model);
          return preCallback(res);
        }
        else return res();
      })
      .then(() => {
        const query = new Query();

        return query.run(tmpQuery)
        .then(response => {
          let items = response.results.rows.length > 0 ? [] : null;
          let itemModel = GetModel(table);

          // Turn response objects into models
          response.results.rows.map(r => {
            items.push(new itemModel(r));
          });

          if (!!postCallback) {
            postCallback(items);
          }

          return resolve(items);
        })
        .catch(err => {
          return reject(err);
        });
      })

    });

  }

  // Conditions
  if(!!options.where)
    where(options.where);

  if(!!options.group)
    group(options.group);

  if(!!options.order)
    sort(options.order);

  if(!!options.limit)
    limit(options.limit);

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
    group,
    limit,
    skip,
    offset: skip, // Alias
    populate,
    populated: () => Object.assign({}, populated),
    exec,
    _pre: callback => {
      preCallback = callback;
    },
    _post: callback => {
      postCallback = callback;
    }
  };

  return selectObject;
};
