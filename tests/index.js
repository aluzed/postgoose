const path = require('path');
const postgoose = require(path.join(__dirname, '..', 'index'));
const conf = require('./test-conf.json');
const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');
const crypto = require('crypto');
const _ = require('lodash');

describe('Tests Postgoose', () => {

  // Connect to the databse
  before(done => {
    postgoose.connect(conf, () => {
      require(path.join(__dirname, 'models', 'people'));
      require(path.join(__dirname, 'models', 'users'));
      done();
    })
  });

  // Test Schema
  require('./schema.spec');

  // Test Model
  require('./model.spec');
})
