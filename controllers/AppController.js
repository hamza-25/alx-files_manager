const { DBClient } = require('../utils/db');
const { getRedisStatus } = require('../utils/redis');

const AppController = {
	getStatus: (req, res) => {
		const redisStatus = getRedisStatus();
		const dbStatus = DBClient.isAlive();

		res.status(200).json({ redis: redisStatus, db: dbStatus });
	},

	getStats: (req, res) => {
		const userCount = DBClient.nbUsers();
		const fileCount = DBClient.nnbFiles();

		res.status(200).json({ users: userCount, files: fileCount });
	},
};

module.exports = AppController;