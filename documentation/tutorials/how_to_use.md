## Connect our database

```javascript
const postgoose = require('postgoose');

const conf = {
  "host"     : "localhost",
  "port"     : 5432,
  "database" : "testdb",
  "user"     : "root",
  "password" : "root"
}

postgoose.connect(conf, () => {
  console.log('connected !');
});
```

## Model definition 

```javascript
const postgoose = require('postgoose');

const PeopleSchema = new postgoose.Schema({
  name     : { type: String },
  details  : { type: String },
  age      : {type: Number },
  created  : { type: Date, default: Date.now },
  modified : { type: Date, default: Date.now }
});

module.exports = postgoose.model('People', PeopleSchema);
```