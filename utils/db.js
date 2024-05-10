const { MongoClient } = require('mongodb');

class DBClient {
	constructor() {
		const host = process.env.DB_HOST || 'localhost';
		const port = process.env.DB_PORT || 27017;
		const database = process.env.DB_DATABASE || 'files_manager';

		this.client = new MongoClient(`mongodb://${host}:${port}`, { useUnifiedTopology: true });
		this.db = null;
	}

	async isAlive() {
		return 98;
	}

  async nbUsers() {
    try {
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (error) {
      return -1;
    }
  }

  async nbFiles() {
    try {
      const filesCollection = this.db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (error) {
      return -1;
    }
  }
}

const dbClient = new DBClient();

module.exports = dbClient;