/**
* @module Queries/TableExists
*
* @description Check if a table exists
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path = require('path');
const Query = require('./query');

/**
 * Return if a table already exist or not
 * 
 * @function TableExists
 * 
 * @param {String} table 
 * @return {Promise}
 */
module.exports = (table) => {
  let tmpQuery = `SELECT * 
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public';`;

  return new Promise((resolve, reject) => {
    const query = new Query();
  
    return query
      .run(tmpQuery)
      .then(response => {
        return resolve(response.results.rows.find(r => 
          r.tablename === table.toLowerCase())
        );
      })
      .catch(err => {
        return reject(err);
      });
  });
}