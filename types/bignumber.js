module.exports = class PgBigNumber {
  constructor(val) {
    return Number(val);
  }

  static get type() {
    return "double";
  }

  static get name() {
    return "BigNumber";
  }

  static toDB(val) {
    return val;
  }

  static toJS(val) {
    return val;
  }
}