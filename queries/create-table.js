/**
* @module Queries
* @resource Create Table
*
* Create a table in our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path    = require('path');
const Query   = require('./query');
const Promise = require('bluebird');
const Types   = require(path.join(__dirname, '..', 'schema', 'types'));

/**
 * @entry Create Table
 * @type Query
 * 
 * Generate the table in our database
 * 
 * @param {String} table 
 * @param {Object} schemaPaths 
 * @return {Promise}
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
  
    query
      .run(tmpQuery)
      .then(response => {
        resolve(true);
      })
      .catch(err => {
        reject(err);
      })
  });
};
