module.exports = class PgId {
  constructor(val) {
    return Number(val);
  }

  static get type() {
    return "serial primary key";
  }

  static get name() {
    return "Id";
  }

  static toDB(val) {
    return val;
  }

  static toJS(val) {
    return val;
  }
}