/* eslint-disable import/no-named-as-default */
const { expect } = require('chai');
const { request } = require('chai');

describe('testing endpoint AppController', () => {
  it('get /status', () => new Promise((done) => {
    request('http://localhost:5000').get('/status').expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).equal({ redis: true, db: true });
      });
    done();
  }));
  it('get /stats', () => new Promise((done) => {
    request('http://localhost:5000').get('/stats').expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).equal({ users: 0, files: 0 });
      });
    done();
  }));
});

describe('testing endpoint UserController', () => {
  it('POST /users', (done) => {
    
  });
});