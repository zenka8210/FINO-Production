const Redis = require('ioredis');
require('dotenv').config();

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Redis configuration with fallback to local Redis
      const redisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Connection timeout
        connectTimeout: 5000,
        commandTimeout: 5000,
        // Reconnection settings
        enableReadyCheck: false
      };

      this.client = new Redis(redisOptions);

      // Event handlers
      this.client.on('connect', () => {
        console.log('🔴 Redis: Connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis: Connected and ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔴 Redis: Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis: Reconnecting...');
      });

      // Try to connect
      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      console.log('🚀 Redis setup completed successfully');

    } catch (error) {
      console.error('❌ Redis setup failed:', error.message);
      console.log('⚠️  Continuing without Redis cache...');
      this.client = null;
      this.isConnected = false;
    }
  }

  getClient() {
    return this.client;
  }

  isRedisConnected() {
    return this.isConnected && this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('🔴 Redis: Disconnected');
    }
  }
}

// Singleton instance
const redisConfig = new RedisConfig();

module.exports = redisConfig;
