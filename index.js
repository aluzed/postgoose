/**
 * @module Postgoose
 * @resource Postgoose Object
 *
 * PostGoose Export Object
 *
 */
const { Schema }     = require('./schema');
const Query          = require('./queries/query');
const { 
  Connection, 
  ConnectionErrors } = require('./connection');
const {
  GetModel,
  GetModels,
  ModelErrors }      = require('./model/model-collection');
const PostgooseModel = require('./model/postgoose-model');
let _dbConfig        = null;

const PostGoose = {
  /**
   * Connect to the database and set the connection for queries
   *
   * @function connect
   *
   * @param {Object} dbConfig : { host: "...", user: "...", password: "..." }
   */
  connect: (dbConfig, callback) => {
    _dbConfig = dbConfig;

    // If there is no connection
    if(!!callback)
      return Connection.connect(dbConfig).then(() => callback());
    else 
      return Connection.connect(dbConfig);
  },
  /**
   * Set or Get a model, like in mongoose
   *
   * @function model
   *
   * @param {String} name Table name
   * @param {Object} schema Schema object (Optionnal)
   * @return {Model}
   */
  model: (name, schema) => {
    // If no schema specified get from models
    if(typeof schema === "undefined") {
      return GetModel(name);
    }

    // Add to models
    return PostgooseModel(name, schema);
  },
  // List of models
  models: GetModels(),
  // display local dbConfig
  _dbConfig,
  // Get Schema class
  Schema,
  /**
   * Run a query and close the connection directly
   *
   * @function runOnce
   *
   * @param {Object} dbConfig Database config
   * @param {String} queryStr Query string
   * @param {Function} callback (err, results) => {...}
   * @return {Promise}
   * @throws {ConnectionNotInitialized}
   */
  runOnce: (dbConfig, queryStr, callback) => {
    if (!PostGoose._dbConfig) throw new Error(ConnectionErrors.ConnectionNotInitialized);

    let query = new Query();

    return new Promise((resolve, reject) => {
      query.run(queryStr)
        .then((res) => {
          currentConnection.end();
          return !!callback ? callback(null, res) : resolve(res);
        })
        .catch(err => {
          currentConnection.end();
          return !!callback ? callback(err) : reject(err);
        });
    })
  },
  /**
   * Execute a query
   *
   * @function run
   *
   * @param {String} queryStr Query string
   * @param {Function} callback (err, results) => {...}
   * @return {Promise}
   * @throws {ConnectionNotInitialized}
   */
  run: (queryStr, callback) => {
    if (!_dbConfig) throw new Error(ConnectionErrors.ConnectionNotInitialized);

    let query = new Query();

    return new Promise((resolve, reject) => {
      query.run(queryStr)
        .then((res) => {
          return !!callback ? callback(null, res) : resolve(res);
        })
        .catch(err => {
          return !!callback ? callback(err) : reject(err);
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
    close: () => {
      _dbConfig = null;
      Connection.disconnect();
    }
  }
}

module.exports = PostGoose;
