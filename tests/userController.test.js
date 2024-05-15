const { expect } = require('chai');
const { request } = require('chai');
const sha1 = require('sha1');
const dbClient = require('../utils/db');

describe('testing endpoint UserController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    // const newUser = await dbClient.db.collection('users').insertOne({
    //   email: 'test@gmail.com', password: sha1('hamzapass123'),
    // });
  });

  after(async () => {
    await dbClient.db.collection('users').deleteOne({ email: 'test@gmail.com' });
  });
  it('pOST /users', () => new Promise((done) => {
    request.post('http://localhost:5000/users').send({
      email: 'test@gmail.com', password: sha1('hamzapass123'),
    }).expect(201).end((err, res) => {
      if (err) return done(err);
      expect(res.body.email).to.equal('test@gmail.com');
    });
  }));
});
