const sha1 = require('sha1');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const UsersController = {
  postNew: async (req, res) => {
    const email = await req.body ? req.body.email : null;
    const password = await req.body ? req.body.password : null;

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    try {
      const user = await dbClient.db.collection('users').findOne({ email });
      if (user) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }
    } catch (error) {
      throw new Error('findOne Error');
    }

    try {
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: sha1(password) });
      return res.status(201).json({ id: newUser.insertedId, email: newUser.ops[0].email });
    } catch (error) {
      throw new Error('insertOne Error');
    }
  },
  getMe: async (req, res) => {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!xToken || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({ id: user._id, email: user.email });
  },
};

module.exports = UsersController;
