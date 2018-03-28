/**
 * @module Core/PostgooseSchema/HooksList
 * 
 * @description List of all hooks
 * 
 * @copyright 2018
 * @author Alexandre PENOMBRE <aluzed_AT_gmail.com>
 */

/**
* List of allowed hooks :
* - create
* - save
* - update
* - updateAll
* - remove
* - removeAll
* - find
* - findByIdAndUpdate
* - findByIdAndRemove
* - findById
* - findOne
*/
const allowedHooks = [
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

module.exports = allowedHooks;