const crypto = require('crypto');
const dbClient = require('../utils/db');

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
      throw new Error('findOne Error');
    }

    const hashObject = crypto.createHash('sha1');
    hashObject.update(password);
    const hashPass = hashObject.digest('hex');

    try {
      const newUser = await dbClient.client.db().collection('users').insertOne({ email, password: hashPass });
      res.status(201).json({ id: newUser.insertedId, email: newUser.ops[0].email });
      return;
    } catch (error) {
      throw new Error('insertOne Error');
    }
  },
};
module.exports = UsersController;
