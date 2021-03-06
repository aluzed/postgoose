const path = require('path');
const postgoose = require(path.join(__dirname, '..', 'index'));
const conf = require('./test-conf.json');
const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');
const crypto = require('crypto');
const _ = require('lodash');


// Libs
require('./helpers/dates');

describe('Tests Schema', () => {
  let People = null;
  let Users = null;
  let __user = null;
  let __people = null;

  before(() => {
    People = postgoose.model('People');
    Users = postgoose.model('Users');
  });

  it('# postgoose.run', done =>  {
    Promise.all(
      [
        postgoose.run('TRUNCATE TABLE people; ALTER SEQUENCE people_id_seq RESTART WITH 1;'),
        postgoose.run('TRUNCATE TABLE users; ALTER SEQUENCE users_id_seq RESTART WITH 1;')
      ]
    ).then(() => {
      done();
    });
  }).timeout(5 * 1000);

  it('# schema.create People', done => {
    const tmpPerson1 = {
      name: 'John Doe',
      age: 30
    };

    const tmpPerson2 = {
      name: 'Jane Doe',
      age: 29
    };


    const tmpPerson3 = {
      name: 'Jerom Din',
      age: 40
    };

    Promise.all(
      [
        People.create(tmpPerson1).then(person => {
          expect(person).to.deep.include(tmpPerson1);
          expect(person).to.have.property('created').to.not.be.null;
          expect(person).to.have.property('modified').to.not.be.null;
        }),
        People.create(tmpPerson2).then(person => {
          expect(person).to.deep.include(tmpPerson2);
          expect(person).to.have.property('created').to.not.be.null;
          expect(person).to.have.property('modified').to.not.be.null;
        }),
        People.create(tmpPerson3).then(person => {
          __people = person;
          expect(person).to.deep.include(tmpPerson3);
          expect(person).to.have.property('created').to.not.be.null;
          expect(person).to.have.property('modified').to.not.be.null;
        })
      ]
    ).then(() => {
      done();
    })
  });

  it('# schema.create Users', done => {
    const tmpUsers1 = {
      username: 'John Doe',
      password: 'qwerty',
      details: 'developer'
    };

    const tmpUsers2 = {
      username: 'Jane Doe',
      password: '123456',
      details: 'designer'
    };

    Promise.all(
      [
        Users.create(tmpUsers1).then(user => {
          expect(user).to.deep.include(_.omit(tmpUsers1, ['password']));
          expect(user.password).to.equal(crypto.createHmac('sha256', tmpUsers1.password).digest('hex'))
          expect(user).to.have.property('created').to.not.be.null;
          expect(user).to.have.property('modified').to.not.be.null;
        }),
        Users.create(tmpUsers2).then(user => {
          expect(user).to.deep.include(_.omit(tmpUsers2, ['password']));
          expect(user.password).to.equal(crypto.createHmac('sha256', tmpUsers2.password).digest('hex'))
          expect(user).to.have.property('created').to.not.be.null;
          expect(user).to.have.property('modified').to.not.be.null;
        })
      ]
    ).then(() => {
      done();
    })
  });

  it('# schema.findOne', done => {
    Users.findOne().then(user => {
      expect(user).to.not.be.null;
      __user = user;
      done();
    })
  });

  it('# schema.find', done => {
    Users.find().then(users => {
      expect(users).to.have.property('length').to.equal(2);
      done();
    })
  });

  it('# schema.find with criteria', done => {
    Promise.all([
      new Promise((res, rej) => {
        People.find({ 'name like': '%Doe%' }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.have.property('length').to.equal(2);
          return res();
        })
      }),
      new Promise((res, rej) => {
        People.find({ 'name like': '%doe%' }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.be.null;
          return res();
        })
      }),
      new Promise((res, rej) => {
        People.find({ 'name ilike': '%doe%' }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.have.property('length').to.equal(2);
          return res();
        })
      }),
      new Promise((res, rej) => {
        People.find({ 'age <': 30 }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.have.property('length').to.equal(1);
          return res();
        })
      }),
      new Promise((res, rej) => {
        People.find({ 'age <=': 30 }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.have.property('length').to.equal(2);
          return res();
        })
      }),
      new Promise((res, rej) => {
        People.find({ 'age >': 30 }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.have.property('length').to.equal(1);
          expect(people[0].name).to.equal('Jerom Din');
          return res();
        })
      }),
      new Promise((res, rej) => {
        People.find({ 'age >=': 29 }, (err, people) => {
          expect(err).to.be.null;
          expect(people).to.have.property('length').to.equal(3);
          return res();
        })
      })
    ])
    .then(() => {
      done();
    })
  }).timeout(10 * 1000);

  it('# schema.findById', done => {
    Users.findById(__user.id, (err, user) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('# schema.findByIdAndUpdate', done => {
    Users.findByIdAndUpdate(__user.id, { username: 'Jacky Doe' }, (err, user) => {
      expect(err).to.be.null;
      expect(user).to.have.property('username').to.equal('Jacky Doe');
      __user = user;
      done();
    })
  });

  it('# schema.findByIdAndRemove', done => {
    // Delete Jerom Din
    People.findByIdAndRemove(__people.id, (err) => {
      expect(err).to.be.null;
      
      People.find({}, (err, people) => {
        expect(err).to.be.null;

        let found = people.filter(p => {
          return p.username === 'Jerom Din';
        });

        expect(people).to.have.property('length').to.equal(2);
        expect(found).to.have.property('length').to.equal(0);
        done();
      })
    })
  });

  it('# schema.updateAll', done => {
    People.updateAll({ 'name ilike': '%doe%' }, { age: 50 }, (err, items) => {
      expect(items).to.have.property('length').to.equal(2);
      expect(items[0]).to.have.property('age').to.equal(50);
      expect(items[1]).to.have.property('age').to.equal(50);
      done();
    })
  });

  it('# schema.insertMany', done => {
    People.insertMany([
      {
        name: 'Titi',
        age: 61
      },
      {
        name: 'Tata',
        age: 62
      },
      {
        name: 'Toto',
        age: 63
      }
    ], (err, results) => {
      expect(err).to.be.null;
      expect(results).to.have.property('length').to.equal(3);
      done();
    })
  })

  it('# schema.removeAll', done => {
    People.removeAll({ 'name ilike': '%doe%' }, (err, removedItems) => {
      expect(removedItems).to.have.property('length').to.equal(2);

      People.find().then(people => {
        expect(people).to.have.property('length').to.equal(3);
        done();
      });
    });
  });

});
