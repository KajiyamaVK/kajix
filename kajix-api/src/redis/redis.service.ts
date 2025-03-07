import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private static instance: Redis | null = null;

  async onModuleInit() {
    if (!RedisService.instance) {
      RedisService.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        lazyConnect: true,
      });
    }
  }

  static getInstance(): Redis {
    if (!RedisService.instance) {
      throw new Error('Redis instance not initialized');
    }
    return RedisService.instance;
  }

  // For testing purposes only
  static setInstance(redis: Redis) {
    RedisService.instance = redis;
  }

  // For cleanup in tests
  static clearInstance() {
    RedisService.instance = null;
  }
}
