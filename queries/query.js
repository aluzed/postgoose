/**
* @module Queries
* @resource Query
*
* Query runner library
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
   * @entry refreshConnection
   * @type Function
   *
   * Get connection from Connection lib
   */
  refreshConnection() {
    this.connection = Connection.getConnection();
  }

  /**
  * @entry run
  * @type Function
  *
  * Execute a sql query
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
