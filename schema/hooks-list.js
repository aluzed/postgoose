/**
 * @module Core/PostgooseSchema
 * 
 * @description list of all hooks
 */

/**
* List of allowed hooks :
* - create
* - save
* - update
* - remove
* - find
* - findByIdAndUpdate
* - findByIdAndRemove
* - findById
* - findOne
*/
module.exports = [
  'create',
  'save',
  'update',
  'remove',
  'find',
  'findByIdAndUpdate',
  'findByIdAndRemove',
  'findById',
  'findOne' 
];