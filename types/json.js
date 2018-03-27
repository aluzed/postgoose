module.exports = class PgJson {
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
    return "json";
  }

  static get name() {
    return "Json";
  }

  static toDB(val) {
    JSON.stringify(val);
  }

  static toJS(val) {
    JSON.parse(val);
  }
}