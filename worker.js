const Queue = require('bull');
const { ObjectId } = require('mongodb');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const dbClient = require('./utils/db');

const fileQueue = new Queue('thumbnails');
const userQueue = new Queue('send email');

fileQueue.process(async (job) => {
  const { fileId } = job.data;
  const { userId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = dbClient.db.collection('files').findOne({
    _id: ObjectId(fileId),
    userId,
  });
  if (!file) {
    throw new Error('File not found');
  }
  const imageBuffer = await fs.readFile(`${file.localPath}`);
  const thumbnail500 = await imageThumbnail(imageBuffer, { width: 500 });
  const thumbnail250 = await imageThumbnail(imageBuffer, { width: 250 });
  const thumbnail100 = await imageThumbnail(imageBuffer, { width: 100 });

  await Promise.all([
    fs.writeFile(`${file.localPath}_500`, thumbnail500),
    fs.writeFile(`${file.localPath}_250`, thumbnail250),
    fs.writeFile(`${file.localPath}_100`, thumbnail100),
  ]);
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) {
    throw new Error('Missing userId');
  }
  const user = dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.ops[0].email}!`);
});
