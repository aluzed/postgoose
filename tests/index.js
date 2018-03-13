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

describe('Tests Postgoose', () => {
  let People = null;
  let Users = null;

  it('Should connect to the databse', done => {
    postgoose.connect(conf, () => {
      People = require(path.join(__dirname, 'models', 'people'));
      Users = require(path.join(__dirname, 'models', 'users'));
      done();
    })
  });

  it('Should clean our database', done => {
    Promise.all(
      [
        postgoose.run('TRUNCATE TABLE people; ALTER SEQUENCE people_id_seq RESTART WITH 1;'),
        postgoose.run('TRUNCATE TABLE users; ALTER SEQUENCE users_id_seq RESTART WITH 1;')
      ]
    ).then(() => {
      done();
    });
  })

  it('Should create people model', done => {
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

  it('Should create users model', done => {
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

})
