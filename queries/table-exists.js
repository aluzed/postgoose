/**
* @module Queries/TableExists
*
* @description Check if a table exists
*
* @copyright 2018
* @author Alexandre PENOMBRE <aluzed_AT_gmail.com>
*/
const path = require('path');
const Query = require('./query');

/**
 * Return if a table already exist or not
 * 
 * @function TableExists
 * 
 * @param {String} table Table name
 * @return {Promise} Bluebird Promise
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
          r.tablename === table.toLowerCase() || null)
        );
      })
      .catch(err => {
        return reject(err);
      });
  });
}