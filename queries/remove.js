/**
* @module Queries
* @resource Remove
*
* Remove data from our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const Query = require('./query');

/**
 * @entry Remove
 * @type Query
 * 
 * Remove an item from our database in a given table
 * 
 * @param {String} table 
 * @param {Number} id 
 * @return {Promise}
 */
module.exports = (table, id) => {
    const query = new Query()

    return new Promise((resolve, reject) => {
        query
            .run('DELETE FROM ' + table.toLowerCase() + ' WHERE id = ' + id + ';')
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
    });
}
