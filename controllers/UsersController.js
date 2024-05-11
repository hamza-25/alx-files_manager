// const sha1 = require('sha1');
// const dbClient = require('../utils/db');

// const UsersController = {
//   postNew: async (req, res) => {
//     const email = req.body ? req.body.email : null;
//     const password = req.body ? req.body.password : null;

//     if (!password) {
//       res.status(400).json({ error: 'Missing password' });
//       return;
//     }
//     if (!email) {
//       res.status(400).json({ error: 'Missing email' });
//       return;
//     }

//     try {
//       const user = await dbClient.client.db().collection('users').findOne({ email });
//       if (user) {
//         res.status(400).json({ error: 'Already exist' });
//         return;
//       }
//     } catch (error) {
//       // throw new Error('findOne Error');
//       console.error('insertOne Error');
//     }

//     try {
//       const newUser = await dbClient.client.db().collection('users')
// .insertOne({ email, password: sha1(password) });
//       res.status(201).json({ id: newUser.insertedId, email: newUser.ops[0].email });
//       return;
//     } catch (error) {
//       // throw new Error('insertOne Error');
//       console.error('insertOne Error');
//     }
//   },
// };
// module.exports = UsersController;
/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const userQueue = new Queue('email sending');

const UsersController = {
  postNew: async (req, res) => {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    // const user = await (await dbClient.usersCollection()).findOne({ email });
    const user = await dbClient.client.db().collection('users').findOne({ email });

    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    // const insertionInfo = await (await dbClient.usersCollection())
    //   .insertOne({ email, password: sha1(password) });
    const insertionInfo = await dbClient.client.db().collection('users').insertOne({ email, password: sha1(password) });
    const userId = insertionInfo.insertedId.toString();

    userQueue.add({ userId });
    res.status(201).json({ email, id: userId });
  },
};
module.exports = UsersController;
