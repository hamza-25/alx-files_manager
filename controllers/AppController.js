const { getRedisStatus, getDBStatus, countUsers, countFiles } = require('../utils');

const AppController = {
	getStatus: (req, res) => {
		const redisStatus = getRedisStatus();
		const dbStatus = getDBStatus();

		res.status(200).json({ redis: redisStatus, db: dbStatus });
	},

	getStats: (req, res) => {
		const userCount = countUsers();
		const fileCount = countFiles();

		res.status(200).json({ users: userCount, files: fileCount });
	},
};

module.exports = AppController;