/**
* @module Queries/Query
*
* @description Query runner library
*
* @copyright 2018
* @author Alexandre PENOMBRE <aluzed_AT_gmail.com>
*/
"use strict";
const Promise        = require('bluebird');
const path           = require('path');
const { 
  Connection, 
  ConnectionErrors 
} = require(path.join(__dirname, '..', 'connection'));

class Query {
  /**
  * constructor
  *
  */
  constructor() {
    this.connection = Connection.getConnection() || null;
  }

  /**
   * Get connection from Connection lib
   *
   * @function refreshConnection
   */
  refreshConnection() {
    this.connection = Connection.getConnection();
  }

  /**
   * Execute a sql query
   *
   * @function run
   *
   * @param {String} queryStr SQL formatted query
   * @return {Promise} Bluebird Promise
   * @throws {ConnectionNotInitialized} 
   */
  run(queryStr) {
    this.refreshConnection();

    if(!this.connection)
      throw new Error(ConnectionErrors.ConnectionNotInitialized);

    return new Promise((resolve, reject) => {
      return this.connection.query(queryStr, function (error, results, fields) {
        if (error)
          return reject(error);

        return resolve({results, fields});
      });
    });
  }

}

module.exports = Query;
