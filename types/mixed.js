module.exports = class PgMixed {
  constructor(val) {
    return String(val);
  }

  static get type() {
    return "text";
  }

  static get name() {
    return "Mixed";
  }

  static toDB(val) {
    return val;
  }

  static toJS(val) {
    return val;
  }
}