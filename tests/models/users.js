const path = require('path');
const postgoose = require(path.join(__dirname, '..', '..', 'index'));

const UsersSchema = new postgoose.Schema({
  username: { type: String },
  password: { type: String },
  created: { type: Date, default: Date.now },
  modified: { type: Date, default: Date.now }
});

UsersSchema.pre('create', function(next, data) {
  console.log(data);
})

module.exports = postgoose.model('Users', UsersSchema);