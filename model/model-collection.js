/**
* @module Core/Model
*
* @description Model Wrapper
*
* Copyright(c) 2018 Alexandre PENOMBRE
* <aluzed_AT_gmail.com>
*/
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
   * @param {String} table Name of the table
   * @param {Object} model Model object
   * @return {Object} model
   */
   SetModel: (table, model) => {
    __models[table] = model;
    return model;
  },
  /**
   * Return a model from the models collection
   *
   * @function GetModel
   *
   * @param {String} table
   * @return {Object} model
   */
   GetModel: (table) => {
    if(typeof table === "undefined")
      throw new Error('Missing parameter');

    if(typeof __models[table] === "undefined")
      throw new Error(localErrors.ModelMissing);

    return __models[table];
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
