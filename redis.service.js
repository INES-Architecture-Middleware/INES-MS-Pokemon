const { createClient } = require('redis');

class RedisService {
    constructor() {
        if (RedisService.instance) {
            return RedisService.instance;
        }

        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://redis:6379',
            socket: {
                reconnectStrategy: (retries) => {
                if (retries > 5) {
                    console.log('Trop de tentatives de reconnexion à Redis');
                    return new Error('Max retries reached');
                }
                return Math.min(retries * 100, 5000);
                }
            }
        });

        this.connectionPromise = null;
        this.isConnected = false;

        this.client.on('error', (err) => console.error('Redis error:', err));
        this.client.on('connect', () => {
            console.log('Redis connected');
            this.isConnected = true;
        });
        this.client.on('end', () => {
            this.isConnected = false;
            console.log('Redis disconnected');
        });

        RedisService.instance = this;
    }

    async connect() {
        if (!this.connectionPromise && !this.isConnected) {
            this.connectionPromise = this.client.connect()
                .then(() => {
                    this.isConnected = true;
                    return this.client;
                })
                .catch(err => {
                    this.connectionPromise = null;
                    throw err;
                });
        }
        return this.connectionPromise;
    }

    async ensureConnection() {
        if (!this.isConnected) {
            await this.connect();
        }
    }

    async get(key) {
        await this.ensureConnection();
        return this.client.get(key);
    }

    async set(key, value) {
        await this.ensureConnection();
        return this.client.set(key, value);
    }
}

module.exports = new RedisService();