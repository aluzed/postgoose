module.exports = class PgText {
  constructor(val) {
    return String(val);
  }

  static get type() {
    return "text";
  }

  static get name() {
    return "Text";
  }

  static toDB(val) {
    return val;
  }

  static toJS(val) {
    return val;
  }
}