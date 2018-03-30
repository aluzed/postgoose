## Insert

### From Static Method

```javascript
const postgoose = require('postgoose');
const People = postgoose.model('People');

// With Promise
People.create({
  name: 'John Doe',
  details: 'User 1',
  age: 40
}).then(people => {
  console.log(people);
}).catch(err => {
  console.error(err.message);
})

// With callback
People.create({
  name: 'John Doe',
  details: 'User 1',
  age: 40
}, (err, people) => {
  if(err)
    console.error(err.message);

  else 
    console.log(people);
})
```

### From Object

```javascript
const postgoose = require('postgoose');
const People = postgoose.model('People');

let people = new People({
  name: 'John Doe',
  details: 'User 1',
  age: 40
});

// With Promise
people
  .save()
  .then(people => {
    console.log(people);
  })
  .catch(err => {
    console.error(err.message);
  })

// With callback
people.save((err, people) => {
  if(err)
    console.error(err.message);

  else 
    console.log(people);
})
```

### Insert Many

```javascript
const postgoose = require('postgoose');
const People = postgoose.model('People');

const list = [
  {
    name: 'John Doe',
    details: 'User 1',
    age: 40
  },
  {
    name: 'Jane Doe',
    details: 'User 2',
    age: 38
  },
  {
    name: 'Johnny Doe',
    details: 'User 3',
    age: 15
  }
];

// With Promise
People
  .insertMany(list)
  .then(() => {
    People
      .find()
      .then(people => {
        console.log(people);
      })
  })
  .catch(err => {
    console.error(err.message);
  });


// With callback
People.insertMany(list, (err, results) => {
  if(err)
    console.error(err.message);

  else
    console.log(results);
})

```