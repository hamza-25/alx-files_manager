import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const AppController = {
  getStatus: (req, res) => {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.check();

		res.status(200).json({ redis: redisStatus, db: dbStatus});
	},

  getStats: (req, res) => {
    const userCount = dbClient.nbUsers();
    const fileCount = dbClient.nbFiles();

    res.status(200).json({ users: userCount, files: fileCount });
  },
};

module.exports = AppController;
