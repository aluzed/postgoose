/**
* @module Core
* @resource Model
*
* Model Wrapper
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const PostgooseModel = require('./postgoose-model');

let __models = {};

/**
* @entry localErrors
* @position before
*
* - ItemExists : The model already exist in the collection.
* - ModelMissing : The model does not exist in the collection.
*/
const localErrors = {
  ItemExists   : 'Item already exist',
  ModelMissing : 'Model not found'
}

module.exports = {
  /**
  * @entry Model
  * @type Function
  *
  * Generate the PostgooseModel Class for the specified table
  *
  * @param {String} table name of the table
  * @param {Object} schema Schema object
  * @return {Object} model
  */
  SetModel: (table, schema) => {
    __models[table] = PostgooseModel(table, schema);

    return __models[table];
  },
  /**
  * @entry GetModel
  * @type Function
  *
  * Return a model from the models collection
  *
  * @param {String} name
  * @return {Object} model
  */
  GetModel: (name) => {
    if(typeof name === "undefined")
      throw new Error('Missing parameter');

    if(typeof __models[name] === "undefined")
      throw new Error(localErrors.ModelMissing);

    return __models[name];
  },
  /**
  * @entry GetModels
  * @type Function
  *
  * Returns the collections of models (read-only)
  *
  * @return {Object} collection of models
  */
  GetModels: () => Object.assign({}, __models),
  /**
  *
  */
  ModelErrors: localErrors
};
