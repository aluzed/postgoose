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

describe('Tests Model', () => {
  let People = null;
  let Users = null;
  let __people = null;

  before(() => {
    People = postgoose.model('People');
    Users = postgoose.model('Users');
  })

  it('# model.save insert', done => {
    let fixture = {
      name: 'toto',
      details: 'test user',
      age: 32
    };

    let tmpPeople = new People(fixture);

    tmpPeople.save((err, people) => {
      __people = people;
      expect(err).to.be.null;
      expect(people).to.deep.include(_.omit(tmpPeople, ['id']));
      expect(people).to.have.property('created').to.not.be.null;
      expect(people).to.have.property('modified').to.not.be.null;
      done();
    })
  });

  it('# model.save update', done => {
    let testValues = {
      name: 'tata',
      details: 'fake user'
    };
    _.assign(people, testValues);

    people.save(err => {
      expect(err).to.be.null;
      
      People.findById(__people.id, (err, people) => {
        expect(err).to.be.null;
        expect(people).to.deep.include(testValues);
        done();
      });
    })
  })

});
