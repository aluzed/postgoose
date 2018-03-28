const path = require('path');
const postgoose = require(path.join(__dirname, '..', '..', 'index'));

const PeopleSchema = new postgoose.Schema({
  name     : { type: String },
  details  : { type: String },
  age      : {type: Number },
  created  : { type: Date, default: Date.now },
  modified : { type: Date, default: Date.now }
});

module.exports = postgoose.model('People', PeopleSchema);