module.exports = class PgJsonB {
  constructor(val) {
    try {
      JSON.stringify(val);

      return val;
    }
    catch(err) {
      return "Invalid Json"
    }
  }

  static get type() {
    return "jsonb";
  }

  static get name() {
    return "JsonB";
  }

  static toDB(val) {
    JSON.stringify(val);
  }

  static toJS(val) {
    JSON.parse(val);
  }
}