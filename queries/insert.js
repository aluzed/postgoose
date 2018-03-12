/**
* @module Queries/Insert
*
* @description Insert data in our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path         = require('path');
const Query        = require('./query');
const dateHelpers  = require(path.join(__dirname, '..', 'helpers', 'dates'));
const Promise      = require('bluebird');
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));
const { GetModel } = require(path.join(__dirname, '..', 'model', 'model-collection'));

/**
 * Insert a new row
 * 
 * @function Insert
 * 
 * @param {String} table 
 * @param {Object} model 
 * @return {Promise}
 */
module.exports = (table, model) => {
  const _schema = model.__proto__.schema.paths;
  let tmpQuery = "INSERT INTO " + table.toLowerCase() + " (";
  let tmpFields = "";
  let tmpValues = "";

  let preCallback = null;
  let postCallback = null;

  /**
   * Execute the query, if there are hooks, execute them too.
   *
   * @function exec
   *
   * @param {Function} callback (err, results) => {...}
   * @return {Promise}
   */
  function exec() {
    return new Promise((resolve, reject) => {

      return new Promise((res, rej) => {
        if(!!preCallback) {
          preCallback = preCallback.bind(model);
          return preCallback(res);
        }
        else res();
      })
      .then(() => {
        let query = new Query();

        for (let field in _schema) {

          // Check validators 
          for (let v in _schema[field].validators) {
            let currentValidator = _schema[field].validators[v];

            if (!currentValidator.validator(model[field])) {
              throw new Error(currentValidator.message);
            }
          }

          let value = (typeof model[field] !== "undefined") ? model[field] : null;

          // Default Value
          if (typeof _schema[field].defaultValue !== "undefined" && value === null)  {
            if (typeof _schema[field].defaultValue === "function")
              value = _schema[field].defaultValue();
            else
              value = _schema[field].default;
          }

          // Only if the field exists in the model table
          if (!!_schema[field] && field !== "id" && (!!model[field] || !!value)) {
            if (tmpFields !== "") {
              tmpFields += ", ";
            }

            tmpFields += field;

            if (tmpValues !== "") {
              tmpValues += ", ";
            }

            let currentInstance = _schema[field].instance;

            // Convert JS to DB
            tmpValues += "\'" + Types[currentInstance].toDB(value) + "\'";
          }
        }

        tmpQuery += tmpFields + ") VALUES (" + tmpValues + ") RETURNING *;";

        return query.run(tmpQuery)
          .then(response => {
            if (response.results.rows.length > 0) {
              let itemModel = GetModel(table);
              let item = new itemModel(response.results.rows[0]);

              if (!!postCallback) {
                postCallback = postCallback.bind(item);
                postCallback(item);
              }

              return resolve(item);
            }
          })
          .catch(err => {
            return reject(err);
          });
      })
     
    });
  }
  
  const insertObject = {
    exec,
    _pre: callback => {
      preCallback = callback;
    },
    _post: callback => {
      postCallback = callback;
    }
  };

  return insertObject;
};
