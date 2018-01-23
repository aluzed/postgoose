/**
 * @module Postgoose
 * @resource Postgoose Object
 *
 * PostGoose Export Object
 *
 */
const { Schema }     = require('./schema');
const Query          = require('./queries/query');
const { Connection } = require('./connection');
const {
  SetModel,
  GetModel,
  GetModels,
  ModelErrors }      = require('./model');

const PostGoose = {
  /**
   * @entry connect
   * @type Function
   *
   * Connect to the database and set the connection for queries
   *
   * @param {Object} dbConfig : { host: "...", user: "...", password: "..." }
   */
  connect: (dbConfig) => {
    // If there is no connection
    Connection.connect(dbConfig);
  },
  /**
   * @entry model
   * @type Function
   *
   * Set or Get a model, like in mongoose
   *
   * @param {String} name
   * @param {Object} schema : optionnal
   * @return {Model}
   */
  model: (name, schema) => {
    // If no schema specified get from models
    if(typeof schema === "undefined") {
      return GetModel(name);
    }

    // Add to models
    return SetModel(name, schema);
  },
  // List of models
  models: GetModels(),
  // display local dbConfig
  _dbConfig: Connection.getConfig(),
  // Get Schema class
  Schema,
  /**
   * @entry runOnce
   * @type Function
   *
   * Run a query and close the connection directly
   *
   * @param {Object} dbConfig
   * @param {String} queryStr
   * @return {Promise}
   * @throws {ConnectionNotInitialized}
   */
  runOnce: (dbConfig, queryStr) => {
    if (!PostGoose._dbConfig) throw new Error(localErrors.ConnectionNotInitialized);

    let query = new Query();

    return new Promise((resolve, reject) => {
      query.run(queryStr)
        .then((res) => {
          currentConnection.end();
          resolve(res);
        })
        .catch(err => {
          currentConnection.end();
          reject(err);
        });
    })
  },
  /**
   * @entry run
   * @type Function
   *
   * Execute a query
   *
   * @param {String} queryStr
   * @return {Promise}
   * @throws {ConnectionNotInitialized}
   */
  run: (queryStr) => {
    if (!PostGoose._dbConfig) throw new Error(localErrors.ConnectionNotInitialized);

    let query = new Query();

    return new Promise((resolve, reject) => {
      query.run(queryStr)
        .then((res) => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    })
  },
  /**
  * @entry connection
  * @type Object
  *
  *
  */
  connection: {
    /**
    * @entry connection.close
    * @type Function
    *
    * Close the socket
    *
    */
    close: () => Connection.disconnect()
  }
}

module.exports = PostGoose;
