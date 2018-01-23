module.exports = class PgBoolean {
  constructor(val) {
    return Boolean(val);
  }

  static get type() {
    return "boolean";
  }

  static get name() {
    return "Boolean";
  }

  static toDB(val) {
    return val === true ? "TRUE" : "FALSE";
  }

  static toJS(val) {
    return val === 't' ? true : false;
  }
}