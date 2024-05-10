import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isConnected = true;

    this.client.on('error', (error) => {
      console.log('Redis Client Error', error);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    this.getAsync = promisify(this.client.GET).bind(this.client);
    this.setAsync = promisify(this.client.SETEX).bind(this.client);
    this.delAsync = promisify(this.client.DEL).bind(this.client);
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    return this.getAsync(key);
  }

  async set(key, value, expire) {
    await this.setAsync(key, expire, value);
  }

  async del(key) {
    await this.delAsync(key);
  }
}

export const redisClient = new RedisClient();
