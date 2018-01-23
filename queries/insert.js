/**
* @module Queries
* @resource Insert
*
* Insert data in our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path         = require('path');
const Query        = require('./query');
const dateHelpers  = require(path.join(__dirname, '..', 'helpers', 'dates'));
const Promise      = require('bluebird');
const { GetModel } = require(path.join(__dirname, '..', 'model'));
const Types        = require(path.join(__dirname, '..', 'schema', 'types'));

/**
 * @entry Insert
 * @type Query
 * 
 * @param {String} table 
 * @param {Object} model 
 * @return {Promise}
 */
module.exports = (table, model) => {
  const _schema = model.schema.paths;
  let tmpQuery = "INSERT INTO " + table.toLowerCase() + " (";
  let tmpFields = "";
  let tmpValues = "";

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
    if(typeof _schema[field].defaultValue !== "undefined" && value === null) {
      if(typeof _schema[field].defaultValue === "function") 
        value = _schema[field].defaultValue();
      else 
        value = _schema[field].defaultValue;
    }
  
    // Only if the field exists in the model table
    if(!!_schema[field] && field !== "id") {
      if (tmpFields !== "") {
        tmpFields += ", ";
      }

      tmpFields += table.toLowerCase() + "." + field;

      if (tmpValues !== "") {
        tmpValues += ", ";
      }

      let currentInstance = _schema[field].instance;

      // Convert JS to DB
      tmpValues = table.toLowerCase() + '.' + field + "=\'" + Types[currentInstance].toDB(value) + "\'";
    }
  }

  tmpQuery += tmpFields + ") VALUES (" + tmpValues + ");";

  return new Promise((resolve, reject) => {
    let query = new Query();
    query.exec(tmpQuery)
      .then(response => {
        if (!!response.results.insertId) {
          query.exec(`SELECT * FROM ${table.toLowerCase()} WHERE ${table}.id = ${response.results.insertId};`)
          .then(res => {
            let item = new GetModel(table)(res.results[0]);
            resolve(item);
          })
          .catch(err => {
            reject(err);
          });
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};
