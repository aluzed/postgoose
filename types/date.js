const path = require('path');
const DatesHelpers = require(path.join(__dirname, '..', 'helpers', 'dates'));

module.exports = class PgDate {
  constructor(val) {
    return Date(val);
  }

  static get type() {
    return "timestamp with time zone";
  }

  static get name() {
    return "Date";
  }

  static toDB(val) {
    return DatesHelpers.toDatetimeSQL(val);
  }

  static toJS(val) {
    return Date(val);
  }
}