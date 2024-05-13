const Queue = require('bull');
const { ObjectId } = require('mongodb');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const dbClient = require('./utils/db');

const fileQueue = new Queue();

fileQueue.process(async (job) => {
  if (!job.data.fileId) {
    throw new Error('Missing fileId');
  }
  if (!job.data.userId) {
    throw new Error('Missing userId');
  }

  const file = dbClient.db.collection('files').findOne({
    _id: ObjectId(job.data.fileId),
    userId: job.data.userId,
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
