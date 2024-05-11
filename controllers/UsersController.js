const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const UsersController = {
  postNew: async (req, res) => {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    try {
      const user = await dbClient.client.db().collection('users').findOne({ email });
      if (user) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }
    } catch (error) {
      // throw new Error('findOne Error');
      console.error('insertOne Error');
    }

    try {
      const newUser = await dbClient.client.db().collection('users').insertOne({ email, password: sha1(password) });
      res.status(201).json({ id: newUser.insertedId, email: newUser.ops[0].email });
      return;
    } catch (error) {
      // throw new Error('insertOne Error');
      console.error('insertOne Error');
    }
  },
  getMe: async (req, res) => {
    const xToken = req.headers['x-Token'];
    // console.log(req.headers['x-Token']); // undefined
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.client.db().collection('users').findOne({ id: userId });
    // console.log(user.email);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ id: user._id, email: user.email });
  },
};
module.exports = UsersController;
