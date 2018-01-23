module.exports = class PgNumber {
  constructor(val) {
    return Number(val);
  }

  static get type() {
    return "real";
  }

  static get name() {
    return "Number";
  }

  static toDB(val) {
    return val;
  }

  static toJS(val) {
    return val;
  }
}