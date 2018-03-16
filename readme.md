## Postgoose

Mongoose-like postgresql library. Minimalistic database feature for the moment :
* CRUD
* some hooks

### Install

```
npm i postgoose
```

**Connect to the database**

```javascript
const conf = {
  "host"     : "localhost",
  "port"     : 5432,
  "database" : "testdb",
  "user"     : "root",
  "password" : "root"
}

postgoose.connect(conf, () => {
  console.log('connected !');
})
```



