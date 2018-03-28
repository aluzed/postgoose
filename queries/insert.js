/**
* @module Queries/Insert
*
* @description Insert data in our Postgresql database
*
* @copyright 2018
* @author Alexandre PENOMBRE <aluzed_AT_gmail.com>
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
 * @param {String} table Table name
 * @param {Object} model Model Object
 * @return {Promise} Bluebird Promise
 */
module.exports = (table, model) => {
  const schema = model._schema.paths;
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
   * @return {Promise} Bluebird Promise
   */
  function exec() {
    return new Promise((resolve, reject) => {

      return new Promise((res, rej) => {
        if(!!preCallback) {
          preCallback = preCallback.bind(model);
          return preCallback(res);
        }
        else return res();
      })
      .then(() => {
        let query = new Query();
        for (let field in schema) {

          // Check validators
          for (let v in schema[field].validators) {
            let currentValidator = schema[field].validators[v];

            if (!currentValidator.validator(model[field])) {
              throw new Error(currentValidator.message);
            }
          }

          let value = (typeof model[field] !== "undefined") ? model[field] : null;

          // Default Value
          if (typeof schema[field].defaultValue !== "undefined" && value === null)  {
            if (typeof schema[field].defaultValue === "function")
              value = schema[field].defaultValue();
            else
              value = schema[field].default;
          }

          // Only if the field exists in the model table
          // The field must not start with _
          if (!!schema[field] && field !== "id" && (!!model[field] || !!value)) {
            if (tmpFields !== "") {
              tmpFields += ", ";
            }

            tmpFields += field;

            if (tmpValues !== "") {
              tmpValues += ", ";
            }

            let currentInstance = schema[field].instance;

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
            else return resolve(null);
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
