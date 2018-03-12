/**
* @module Queries/Remove
*
* @description Remove data from our Postgresql database
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const Query = require('./query');
const Promise = require('bluebird');

/**
 * Remove an item from our database in a given table
 * 
 * @function Remove
 * 
 * @param {String} table 
 * @param {Number} id 
 * @return {Promise}
 */
module.exports = (table, id) => {
    
    let tmpQuery = 'DELETE FROM ' + table.toLowerCase() + ' WHERE id = ' + id;
    
    let preCallback = null;
    let postCallback = null;
    
    function exec(callback) {
        return new Promise((resolve, reject) => {
            if (preCallback !== null) {
                preCallback(resolve);
            }
            else resolve();
        }).then(() => {
            return new Promise((resolve, reject) => {
                const query = new Query();
                query
                    .run(tmpQuery)
                    .then(result => {
                        if (postCallback !== null) {
                            postCallback(response.results);
                        }
                        !!callback ? callback(null, response.results) : resolve(response.results);
                    })
                    .catch(err => {
                        !!callback ? callback(err) : reject(err);
                    })
            });
        });
    }
}
