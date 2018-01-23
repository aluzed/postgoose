module.exports = class PgUuid {
  constructor(val) {
    if(val.match(/[g-zG-Z_\\/'"!?$¨^{}]+/))
      throw new Error('Error bad uuid format');
    
    return val;
  }

  static get type() {
    return "uuid";
  }

  static get name() {
    return "Uuid";
  }

  static toDB(val) {
    return val;
  }

  static toJS(val) {
    return val;
  }
}