/**
* @module Queries/Update
*
* @description Update data in our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path         = require('path');
const Promise      = require('bluebird');
const Query        = require('./query');
const dateHelpers  = require(path.join(__dirname, '..', 'helpers', 'dates'));
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));
const { GetModel } = require(path.join(__dirname, '..', 'model', 'model-collection'));

/**
 * Update an item in our database
 * 
 * @function Update
 * 
 * @param {String} table 
 * @param {Object} model 
 * @return {Promise}
 */
module.exports = (table, model) => {
  if(!model.id) 
    throw new Error('Error, unable to update an item without id (NO PRIMARY KEY)');

  const currentId = model.id;
  const _schema = model._schema.paths;
  let tmpQuery = "UPDATE " + table.toLowerCase() + " SET ";
  let tmpValues = "";

  let preCallback = null;
  let postCallback = null;

  /**
   * 
   * @function exec
   * 
   * @return {Promise}
   */
  function exec() {
    return new Promise((resolve, reject) => {

      return new Promise((res, rej) => {
        if (!!preCallback) {
          preCallback = preCallback.bind(model);
          return preCallback(res);
        }
        else return res();
      })
      .then(() => {
        let query = new Query();

        // Check validators
        for (let field in _schema) {
          for (let v in _schema[field].validators) {
            let currentValidator = _schema[field].validators[v];

            if (!currentValidator.validator(model[field])) {
              throw new Error(currentValidator.message);
            }
          }
        }

        for (let field in model) {
          // Only if the field exists in the model table
          if (!!_schema[field] && field !== "id") {

            if (tmpValues !== "") {
              tmpValues += ", ";
            }

            let currentInstance = _schema[field].instance;

            // Convert JS to DB
            tmpValues = table.toLowerCase() + '.' + field + "=\'" + Types[currentInstance].toDB(model[field]) + "\'";
          }
        }

        tmpQuery += tmpValues + " WHERE " + table.toLowerCase() + ".id=\'" + currentId + "\' RETURNING *;";

        return query.run(tmpQuery)
          .then(response => {
            if(response.results.rows.length > 0) {
              let item = new GetModel(table)(res.results.rows[0]);

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
          })
      })
    })
  }

  const updatetObject = {
    exec,
    _pre: callback => {
      preCallback = callback;
    },
    _post: callback => {
      postCallback = callback;
    }
  };

  return updateObject;
};
