/**
* @module Queries/Query
*
* @description Query runner library
*
* Copyright (c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
"use strict";
const Promise        = require('bluebird');
const path           = require('path');
const { 
  Connection, 
  ConnectionErrors } = require(path.join(__dirname, '..', 'connection'));

class Query {
  /**
  * constructor
  *
  */
  constructor() {
    this.connection = null;
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
   * @param {String} queryStr
   * @return {Promise}
   * @throws {ConnectionNotInitialized}
   */
  run(queryStr) {
    this.refreshConnection();

    if(!this.connection)
      throw new Error(ConnectionErrors.ConnectionNotInitialized);

    return new Promise((resolve, reject) => {
      this.connection.query(queryStr, function (error, results, fields) {
        if (error)
          reject(error);

        resolve({results, fields});
      });
    });
  }

}

module.exports = Query;
