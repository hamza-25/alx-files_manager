const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const AuthController = {
  getConnect: async (req, res) => {
    const token = req.header('Authorization').split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const email = Buffer.from(token, 'base64').toString().split(':')[0];
    const hashPassword = sha1(Buffer.from(token, 'base64').toString().split(':')[1]);
    if (!email || !hashPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
      await redisClient.set(key, user._id.toString(), (60 * 60 * 24));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Erro' });
    }
    return res.status(200).json({ token: generateToken });
  },
  getDisconnect: async (req, res) => {
    const xToken = req.header('X-Token');
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!xToken || !userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await redisClient.del(`auth_${xToken}`);
    res.status(204).send();
  },
};

module.exports = AuthController;
