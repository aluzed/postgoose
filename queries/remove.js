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
const { GetModel } = require('../model/model-collection');

/**
 * Remove an item from our database in a given table
 * 
 * @function Remove
 * 
 * @param {String} table 
 * @param {Number} id 
 * @param {Object} model Model Object
 * @return {Promise}
 */
module.exports = (table, id, model) => {
    
    let tmpQuery = 'DELETE FROM ' + table.toLowerCase() + ' WHERE id = ' + id;
    let preCallback = null;
    let postCallback = null;
        

    /**
     * Execute the query, if there are hooks, execute them too.
     *
     * @function exec
     *
     * @return {Promise}
     */
    function exec(callback) {
        return new Promise((resolve, reject) => {
            return new Promise((res, rej) => {
                if (!!preCallback) {
                    preCallback = preCallback.bind(model);
                    return preCallback(res);
                }
                else return res();
            })
            .then(() => {
                const query = new Query();
                return query
                    .run(tmpQuery)
                    .then(result => {
                        if (!!postCallback) {
                            postCallback(model);
                        }
                        return resolve(model);
                    })
                    .catch(err => {
                        return reject(err);
                    })
            })
        });
    }

    const removeObject = {
        exec,
        _pre: callback => {
            preCallback = callback;
        },
        _post: callback => {
            postCallback = callback;
        }
    };

    return removeObject
}
