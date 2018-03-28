/**
 * @module Postgoose
 *  
 * @description Postgoose Object
 * 
 * @copyright 2018
 * @author Alexandre PENOMBRE <aluzed_AT_gmail.com>
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
const Promise        = require('bluebird');

const PostGoose = {
  /**
   * Connect to the database and set the connection for queries
   *
   * @function connect
   *
   * @param {Object} dbConfig { host: "...", user: "...", password: "..." }
   * @example
   *
   * const postgoose = require('postgoose');
   * postgoose.connect({
   *   "host"     : "localhost",
   *   "port"     : 5432,
   *   "database" : "database_name",
   *   "user"     : "johndoe",
   *   "password" : "qwerty"
   * }, () => {
   *  console.log('connected !');
   * })
   * 
   */
  connect: (dbConfig, callback) => {
    _dbConfig = dbConfig;

    Connection
        .connect(dbConfig)
        .then(() => {
          if(!!callback)
            callback();
        });
  },
  /**
   * Set or Get a model, like in mongoose
   *
   * @function model
   *
   * @param {String} name Table name
   * @param {Object} schema Schema object (Optionnal)
   * @return {Model}
   * @example 
   * 
   * // Set model
   * postgoose.model('modelName', modelSchema);
   * 
   * // Get model
   * const myModel = postgoose.modelt('modelName');
   * myModel.find()...
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
   * @return {Promise} Bluebird Promise
   * @throws {ConnectionNotInitialized}
   * 
   * @example 
   * 
   * postgoose.runOnce({
   *   "host"     : "localhost",
   *   "port"     : 5432,
   *   "database" : "database_name",
   *   "user"     : "johndoe",
   *   "password" : "qwerty"
   * }, "SELECT id, username, email FROM users WHERE active = t", (err, results) => {
   *    if(err)
   *      console.trace(err);
   * 
   *    console.log(results);
   * })
   * 
   * // Or with promises
   * postgoose..runOnce({
   *   "host"     : "localhost",
   *   "port"     : 5432,
   *   "database" : "database_name",
   *   "user"     : "johndoe",
   *   "password" : "qwerty"
   * }, "SELECT * FROM table").then(results => {
   *    console.log(results);
   * })
   */
  runOnce: (dbConfig, queryStr, callback) => {
    return PostGoose.connect(dbConfig).then(() => {
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
    });
  },
  /**
   * Execute a query
   *
   * @function run
   *
   * @param {String} queryStr Query string
   * @param {Function} callback (err, results) => {...}
   * @return {Promise} Bluebird Promise
   * @throws {ConnectionNotInitialized}
   * 
   * @example 
   * 
   * // Once postgoose is connected
   * postgoose.run("SELECT * FROM files", (err, results) => {
   *    if(err)
   *      console.trace(err);
   * 
   *    console.log(results);
   * })
   * 
   * // Or with promises
   * postgoose.run("SELECT * FROM table").then(results => {
   *    console.log(results);
   * })
   * 
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
