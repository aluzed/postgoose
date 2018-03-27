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

    _.assign(__people, testValues);

    __people.save(err => {
      expect(err).to.be.null;

      People.findById(__people.id, (err, people) => {
        expect(err).to.be.null;
        expect(people).to.deep.include(_.extend(testValues, { age: 32 }));
        done();
      });
    })
  });

  it('# model.update', done => {
    __people.update({
      name: 'titi'
    }, (err, people) => {
      expect(err).to.be.null;
      expect(people).to.have.property('name').to.equal('titi');
      done();
    })
  });

  it('# model.remove', done => {
    __people.remove().then(() => {
      People.find({}, (err, people) => {
        expect(err).to.be.null;
        
        let found = people.filter(p => {
          return p.name === 'titi';
        });

        expect(found).to.have.property('length').to.equal(0);
        done();
      });
    })
  });

});
