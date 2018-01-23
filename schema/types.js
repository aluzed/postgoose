/**
 * @module Core
 * @resource PostgooseSchema
 * 
 * 
 */
const path = require('path');
module.exports = 
/**
* @start_entry TypesList
* @position before
* @plugin json-to-table
*
* List of types
*
* JSON Doc: http://clarkdave.net/2013/06/what-can-you-do-with-postgresql-and-json/
*
*/
{
  Mixed     : require(path.join(__dirname, '..', 'types', 'mixed')),
  Uuid      : require(path.join(__dirname, '..', 'types', 'uuid')),
  String    : require(path.join(__dirname, '..', 'types', 'string')),
  Text      : require(path.join(__dirname, '..', 'types', 'text')),
  Id        : require(path.join(__dirname, '..', 'types', 'id')),
  Boolean   : require(path.join(__dirname, '..', 'types', 'boolean')),
  Number    : require(path.join(__dirname, '..', 'types', 'number')),
  BigNumber : require(path.join(__dirname, '..', 'types', 'bignumber')),
  Date      : require(path.join(__dirname, '..', 'types', 'date')),
  Json      : require(path.join(__dirname, '..', 'types', 'json')),
  JsonB     : require(path.join(__dirname, '..', 'types', 'jsonb'))
}
/**
* @end_endry TypesList
*/
;