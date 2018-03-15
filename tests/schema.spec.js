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

  before(() => {
    People = require(path.join(__dirname, 'models', 'people'));
    Users = require(path.join(__dirname, 'models', 'users'));
  })

  it('# postgoose.run', done =>  {
    Promise.all(
      [
        postgoose.run('TRUNCATE TABLE people; ALTER SEQUENCE people_id_seq RESTART WITH 1;'),
        postgoose.run('TRUNCATE TABLE users; ALTER SEQUENCE users_id_seq RESTART WITH 1;')
      ]
    ).then(() => {
      done();
    });
  })

  it('# schema.create People' => {
    const tmpPerson1 = {
      name: 'John Doe',
      age: 30
    };

    const tmpPerson2 = {
      name: 'Jane Doe',
      age: 29
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
        })
      ]
    ).then(() => {
      done();
    })
  })

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
  })


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

  it('# schema.findById', done => {
    Users.findById(__user.id, (err, user) => {
      expect(err).to.be.null;
      done();
    });
  })

});
