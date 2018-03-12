const path = require('path');
const dateHelpers = require(path.join(__dirname, '..', '..', 'helpers', 'dates'));
const chai = require('chai');
const expect = chai.expect;


describe('Tests Dates Helpers', () => {
  
  it('Should return SQL date', () => {
    let newDate = new Date("Tue, 02 Jan 2018 09:10:56 GMT");

    let d = dateHelpers.toDateSQL(newDate);

    expect(d).to.equal('2018-01-02');
  });

  it('Should return a SQL datetime', () => {
    let date = new Date("Tue, 02 Jan 2018 09:10:56 GMT");

    // Do not look at GMT (GMT = 0)
    let newDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000)

    let d = dateHelpers.toDatetimeSQL(newDate);

    expect(d).to.equal('2018-01-02 09:10:56');
  })
});