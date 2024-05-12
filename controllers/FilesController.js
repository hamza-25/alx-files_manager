const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FilesController = {
  postUpload: async (req, res) => {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    // const types = ['folder', 'file', 'image'];
    const { name } = req.body;
    const { type } = req.body;
    const { data } = req.body;
    const parentId = req.body.parentId ? req.body.parentId : 0;
    const isPublic = req.body.isPublic ? req.body.isPublic : false;
    try {
      const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!name) {
        res.status(400).json({ error: 'Missing name' });
      }

      if (!type) { // || !(type in types)
        res.status(400).json({ error: 'Missing type' });
      }

      if (!data && type !== 'folder') {
        res.status(400).json({ error: 'Missing data' });
      }

      if (parentId) {
        const parentExists = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parentExists) {
          res.status(400).json({ error: 'Parent not found' });
        }

        if (parentExists.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      if (type === 'folder') {
        const newFile = await dbClient.client.db().collection('files').insertOne({
          userId: user._id.toString(),
          name,
          type,
          parentId,
          isPublic,
        });
        res.status(201).json({
          id: newFile.ops[0]._id,
          userId: user._id.toString(),
          name: newFile.ops[0].name,
          type: newFile.ops[0].type,
          isPublic: newFile.ops[0].isPublic,
          parentId: newFile.ops[0].parentId,
        });
      }
      const path = process.env.FOLDER_PATH ? process.env.FOLDER_PATH : '/tmp/files_manager';
      const fileName = uuidv4();
      const newFile = await dbClient.client.db().collection('files').insertOne({
        userId: user._id.toString(),
        name,
        type,
        parentId,
        isPublic,
        localPath: `${path}/${fileName}`,
      });

      const content = Buffer.from(data, 'base64').toString('utf-8');
      fs.writeFile(`${path}/${fileName}`, content, (err) => {
        if (err) {
          throw new Error(err);
        }
      });
      return res.status(201).json({
        id: newFile.ops[0]._id,
        userId: user._id.toString(),
        name: newFile.ops[0].name,
        type: newFile.ops[0].type,
        isPublic: newFile.ops[0].isPublic,
        parentId: newFile.ops[0].parentId,
      });
    } catch (error) {
      throw new Error(error);
    }
  },
};

module.exports = FilesController;
