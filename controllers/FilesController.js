const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const Queue = require('bull');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const fileQueue = new Queue('thumbnails');

function writeFile(filePath, content) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

const FilesController = {
  postUpload: async (req, res) => {
    // try {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const TYPES = { folder: 'folder', file: 'file', image: 'image' };
    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    const data = req.body ? req.body.data : '';
    const parentId = req.body.parentId ? req.body.parentId : 0;
    const isPublic = req.body.isPublic ? req.body.isPublic : false;

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !Object.values(TYPES).includes(type)) {
      res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentExists = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentExists) {
        res.status(400).json({ error: 'Parent not found' });
      }

      if (parentExists.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      const newFolder = await dbClient.db.collection('files').insertOne({
        userId: user._id,
        name,
        type,
        parentId,
        isPublic,
      });
      fileQueue.add({
        userId: user.inserteId, fileId: newFolder.inserteId,
      });
      return res.status(201).json({
        id: newFolder.ops[0]._id,
        userId: user._id.toString(),
        name: newFolder.ops[0].name,
        type: newFolder.ops[0].type,
        isPublic: newFolder.ops[0].isPublic,
        parentId: newFolder.ops[0].parentId,
      });
    }
    const path = process.env.FOLDER_PATH ? process.env.FOLDER_PATH : '/tmp/files_manager';
    const fileName = uuidv4();
    const newFile = await dbClient.db.collection('files').insertOne({
      userId: user._id,
      name,
      type,
      parentId,
      isPublic,
      localPath: `${path}/${fileName}`,
    });

    const content = Buffer.from(data, 'base64').toString('utf-8');
    // write file , create path if not exists
    writeFile(`${path}/${fileName}`, content);
    fileQueue.add({ userId: user.inserteId, fileId: newFile.inserteId });
    return res.status(201).json({
      id: newFile.ops[0]._id,
      userId: user._id.toString(),
      name: newFile.ops[0].name,
      type: newFile.ops[0].type,
      isPublic: newFile.ops[0].isPublic,
      parentId: newFile.ops[0].parentId,
    });
    // } catch (error) {
    // throw new Error(error);
    // }
  },
  getShow: async (req, res) => {
    const { id } = req.params;
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
    // console.log(file);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(file); // need change _id to id
  },
  getIndex: async (req, res) => {
    try {
      const { parentId } = req.query;
      const xToken = req.headers['x-token'];

      if (!xToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${xToken}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let query = {};
      if (parentId !== undefined) {
        query = { parentId };
      }

      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20;
      const skip = page * pageSize;

      const files = await dbClient.db.collection('files')
        .find(query)
        .skip(skip)
        .limit(pageSize)
        .toArray();

      return res.status(200).json(files);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  putPublish: async (req, res) => {
    const { id } = req.params;
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });
    return res.status(200).json({
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  },
  putUnpublish: async (req, res) => {
    const { id } = req.params;
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });
    return res.status(200).json({
      id,
      userId,
      name: file.name,
      file: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  },
  getFile: async (req, res) => {
    const { id } = req.params;
    const size = req.query.size ? req.query.size : null;
    const file = await dbClient.db.collection('files').findOne({
      _id: ObjectId(id),
    });
    let filePath = `${file.localPath}`;
    if (size) {
      filePath = `${file.localPath}_${size}`;
    }
    if (!file || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    if (file.isPublic === false) {
      const xToken = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${xToken}`);
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user || file.userId.toString() !== user._id.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
      const data = await fs.readFile(filePath);
      const mimeType = mime.contentType(file.name);
      return res.header('Content-Type', mimeType).status(200).send(data);
    }
    const data = await fs.readFile(filePath);
    const mimeType = mime.contentType(file.name);
    return res.header('Content-Type', mimeType).status(200).send(data);
  },
};

module.exports = FilesController;
