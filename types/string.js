module.exports = class PgString {
  constructor(val) {
    return String(val);
  }

  static get type() {
    return "varchar(255)";
  }

  static get name() {
    return "String";
  }

  static toDB(val) {
    if(!!val)
      return val.substring(0, 255);
    else return val;
  }

  static toJS(val) {
    return val;
  }
}