/**
* @module Core/Model
*
* @description Model Wrapper
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
const PostgooseModel = require('./postgoose-model');

let __models = {};

/**
* localErrors
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
   * Generate the PostgooseModel Class for the specified table
   *
   * @function SetModel
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
   * Return a model from the models collection
   *
   * @function GetModel
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
   * Returns the collections of models (read-only)
   *
   * @function GetModels
   *
   * @return {Object} collection of models
   */
   GetModels: () => Object.assign({}, __models),
  /**
   *
   */
  ModelErrors: localErrors
};
