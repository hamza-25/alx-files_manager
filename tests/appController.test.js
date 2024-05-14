/* eslint-disable import/no-named-as-default */
const { expect } = require('chai');
const { request } = require('chai');

describe('testing endpoint status', () => {
  it('get /status', () => new Promise((done) => {
    request('http://localhost:5000').get('/status').expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).equal({ redis: true, db: true });
      });
    done();
  }));
});
