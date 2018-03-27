/**
* @module Queries/CreateTable
*
* @description Create a table in our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path    = require('path');
const Query   = require('./query');
const Promise = require('bluebird');
const Types   = require(path.join(__dirname, '..', 'schema', 'types'));

/**
 * Generate the table in our database
 * 
 * @function CreateTable
 * 
 * @param {String} table Table name
 * @param {Object} schemaPaths Each columns
 * @return {Promise} Bluebird Promise
 */
module.exports = (table, schemaPaths) => {
  let tmpQuery = "CREATE TABLE IF NOT EXISTS " + table.toLowerCase() + " (id " + Types['Id'].type;

  // Check required
  for (let field in schemaPaths) {
      tmpQuery += ", ";

    // Get Database type from Types
    tmpQuery += field + " " + Types[schemaPaths[field].instance].type;
    
    if (!!schemaPaths[field].unique) {
      tmpQuery += " UNIQUE";
    }

    if (!!schemaPaths[field].required) {
      tmpQuery += " NOT NULL";
    }
  }

  tmpQuery += ")";


  return new Promise((resolve, reject) => {
    const query = new Query();
  
    return query
      .run(tmpQuery)
      .then(response => {
        return resolve(true);
      })
      .catch(err => {
        return reject(err);
      })
  });
};
