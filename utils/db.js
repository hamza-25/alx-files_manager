const { MongoClient } = require('mongodb');

class DBClient {
	constructor() {
		const host = process.env.DB_HOST || 'localhost';
		const port = process.env.DB_PORT || 27017;
		const database = process.env.DB_DATABASE || 'files_manager';

		this.client = new MongoClient(`mongodb://${host}:${port}`, { useUnifiedTopology: true });
		this.db = null;
	}

	isAlive() {
		return 98;
	}

   nbUsers() {
    try {
      const usersCollection = this.db.collection('users');
      const count =  usersCollection.countDocuments();
      return count;
    } catch (error) {
      return -1;
    }
  }

   nbFiles() {
    try {
      const filesCollection = this.db.collection('files');
      const count =  filesCollection.countDocuments();
      return count;
    } catch (error) {
      return -1;
    }
  }
}

export const dbClient = new DBClient();
