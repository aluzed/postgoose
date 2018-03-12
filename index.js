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
   * Connect to the database and set the connection for queries
   *
   * @function connect
   *
   * @param {Object} dbConfig : { host: "...", user: "...", password: "..." }
   */
  connect: (dbConfig) => {
    // If there is no connection
    Connection.connect(dbConfig);
  },
  /**
   * Set or Get a model, like in mongoose
   *
   * @function model
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
   * Run a query and close the connection directly
   *
   * @function runOnce
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
   * Execute a query
   *
   * @function run
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
  connection: {
    /**
     * Close the socket
     *
     * @function connection.close
     *
     */
    close: () => Connection.disconnect()
  }
}

module.exports = PostGoose;
