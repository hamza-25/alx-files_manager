const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const AuthController = {
  getConnect: async (req, res) => {
    const token = req.headers.Authorization.split(' ')[1];
    const email = Buffer.from(token, 'base64').toString().split(':')[0];
    const hashPassword = sha1(Buffer.from(token, 'base64').toString().split(':')[1]);
    const generateToken = uuidv4();
    try {
      const user = await dbClient.db.collection('users').findOne({ email });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (hashPassword !== user.password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const key = `auth_${generateToken}`;
      redisClient.set(key, user._id.toString(), (60 * 60 * 24));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
    return res.status(200).json({ token: generateToken });
  },
  getDisconnect: async (req, res) => {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await redisClient.del(`auth_${xToken}`);
    res.status(204).send();
  },
};

module.exports = AuthController;
