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
module.exports = {
  create            : 'CREATE_HOOK',
  save              : 'SAVE_HOOK',
  update            : 'UPDATE_HOOK',
  remove            : 'REMOVE_HOOK',
  find              : 'FIND_HOOK',
  findByIdAndUpdate : 'FINDBYIDANDUPDATE_HOOK',
  findByIdAndRemove : 'FINDBYIDANDREMOVE_HOOK',
  findById          : 'FINDBYID_HOOK',
  findOne           : 'FINDONE_HOOK'
};