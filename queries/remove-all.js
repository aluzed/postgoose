/**
* @module Queries/Remove
*
* @description Remove data from our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const Query = require('./query');
const Promise = require('bluebird');
const { GetModel  } = require('../model/model-collection');

/**
 * Remove an item from our database in a given table
 * 
 * @function Remove
 * 
 * @param {String} table Table name
 * @param {Object} model Model Object
 * @return {Promise} Bluebird Promise
 */
module.exports = (table, model) => {

  let tmpQuery = 'DELETE FROM ' + table.toLowerCase();
  let preCallback = null;
  let postCallback = null;

  /**
   * If the field has one of these values
   * - constraint pendingCondition
   * - constraint array must be type of Array
   * 
   * @function in
   *
   *
   * @param {Array} array
   * @return {Object} selectObject
   * @throws {paramTypeMismatch}
   */
  function isIn(array) {
    if (!pendingCondition)
      return;

    if (typeof array === "undefined")
      throw new Error(localErrors.paramTypeMismatch);

    if (typeof array.splice === "undefined")
      throw new Error(localErrors.paramTypeMismatch);

    tmpConditions += '(';

    for (let a in arr)  {
      let tmpVal = arr[a];

      tmpConditions += `'${tmpVal}'`;

      // If there next value exists
      if (typeof arr[a + 1] !== "undefined")
        tmpConditions += ', ';
    }

    tmpConditions += ')';
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
    if (typeof conditions.splice !== "undefined") {
      for (let w in conditions) {
        tmpConditions += tmpConditions === "" ? conditions[w] : (" AND " + conditions[w]);
      }
      return this;
    }
    if (typeof conditions === "string") {
      // If current path does not exist (the field is not in current model)
      if (typeof schema[conditions] === "undefined")
        return;

      tmpConditions += (tmpConditions === "") ? (table.toLowerCase() + '.' + conditions) : (" AND " + table.toLowerCase() + '.' + conditions);
      pendingCondition = true;

      return this;
    }

    throw new Error(localErrors.paramTypeMismatch);
  }

  /**
   * Execute the query, if there are hooks, execute them too.
   *
   * @function exec
   *
   * @return {Promise}
   */
  function exec(callback) {
    if (tmpConditions !== "")
      tmpQuery += " WHERE " + tmpConditions;
    else  
      tmpQuery += " WHERE 1=1"

    return new Promise((resolve, reject) => {
      return new Promise((res, rej) => {
        if (!!preCallback) {
          preCallback = preCallback.bind(model);
          return preCallback(res);
        }
        else return res();
      })
        .then(() => {
          const query = new Query();
          return query
            .run(tmpQuery)
            .then(result => {
              if (!!postCallback) {
                postCallback(model);
              }
              return resolve(model);
            })
            .catch(err => {
              return reject(err);
            })
        })
    });
  }

  const removeObject = {
    exec,
    _pre: callback => {
      preCallback = callback;
    },
    _post: callback => {
      postCallback = callback;
    }
  };

  return removeObject
}
