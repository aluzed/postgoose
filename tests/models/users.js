const path = require('path');
const postgoose = require(path.join(__dirname, '..', '..', 'index'));
const crypto = require('crypto');

const UsersSchema = new postgoose.Schema({
  username : { type: String },
  password : { type: String },
  details  : { type: String },
  created  : { type: Date, default: Date.now },
  modified : { type: Date, default: Date.now }
});

UsersSchema.pre('create', function(next) {
  this.password = crypto.createHmac('sha256', this.password).digest('hex');
  return next();
})

module.exports = postgoose.model('Users', UsersSchema);