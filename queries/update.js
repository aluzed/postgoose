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
const { GetModel } = require(path.join(__dirname, '..', 'model'));
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));

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
  const _schema = model.schema.paths;
  let tmpQuery = "UPDATE " + table.toLowerCase() + " SET ";
  let tmpValues = "";

  // Check validators
  for (let field in _schema) {
    for(let v in _schema[field].validators) {
      let currentValidator = _schema[field].validators[v];

      if(!currentValidator.validator(model[field])) {
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

  tmpQuery += tmpValues + " WHERE " + table.toLowerCase() + ".id=\'" + currentId + "\';";

  return new Promise((resolve, reject) => {
    const query = Query();
    query.run(tmpQuery)
      .then(response => {
        query.run(`SELECT * FROM ${table.toLowerCase()} WHERE ${table}.id = ${currentId};`)
          .then(res => {
            let item = new GetModel(table)(res.results[0]);
            resolve(item);
          })
          .catch(err => {
            reject(err);
          })
      })
      .catch(err => {
        reject(err);
      })
  });
};
