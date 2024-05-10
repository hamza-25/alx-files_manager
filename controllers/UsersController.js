const crypto = require('crypto');
const dbClient = require('../utils/db');
// const redisClient = require('../utils/redis');

const UsersController = {
  postNew: (req, res) => {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;
    const hashObject = crypto.createHash('sha1');
    hashObject.update(password);
    const hashPass = hashObject.digest('hex');
    try {
      const user = dbClient.db.collection.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Already exist' });
      }
    } catch (error) {
      throw new Error('findOne Error');
    }
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    try {
      const newUser = dbClient.db.collection('users').insertOne({ email, password: hashPass });
      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      throw new Error('insertOne Error');
    }
  },
};
module.exports = UsersController;
