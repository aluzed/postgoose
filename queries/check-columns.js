/**
* @module Queries/CheckColumns
*
* @description Check each columns and look if schema has changed
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const path  = require('path');
const Query = require('./query');
const Types = require(path.join(__dirname, '..', 'schema', 'types'));

function compareColumn(column, schemaPath) {

}

/**
 * Check each column of a given table and notify in case of change
 * 
 * @function Check Columns
 * 
 * @param {String} table Table name
 * @param {Object} schemaPaths Each columns
 * @return {Promise}
 */
module.exports = (table, schemaPaths) => {
  let tmpQuery = `SELECT column_name, data_type     
    FROM information_schema.columns WHERE table_name='${table.toLowerCase()}';`;

  return new Promise((resolve, reject) => {
    const query = new Query();

    return query
      .run(tmpQuery)
      .then(response => {
        let changed = false;
        let chagnedFields = [];

        for(let i in response.results.rows) {
          let column = response.results.rows[i];

          if(column.column_name !== "id") {
            let currentType = Types[schemaPaths[column.column_name].instance].type;

            switch (column.data_type) {
              // String case
              case "character varying":
                if (currentType !== "varchar(255)") {
                  changed = true;
                  chagnedFields.push(column.column_name);
                }
              break;
              // Default
              default: 
                if (column.data_type !== currentType) {
                  changed = true;
                  chagnedFields.push(column.column_name);
                }
              break;
            }
          }
        }
        
        return resolve({
          changed,
          chagnedFields
        });
      })
      .catch(err => {
        return reject(err);
      });
  });
}
