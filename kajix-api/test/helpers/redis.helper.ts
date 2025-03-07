import { Redis } from 'ioredis';

export class RedisHelper {
  private static instance: Redis | null = null;
  private static isShuttingDown = false;
  private static cleanupPromises: Promise<any>[] = [];

  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        lazyConnect: true,
        connectTimeout: 5000,
        disconnectTimeout: 2000,
      });
    }
    return this.instance;
  }

  static addCleanupPromise(promise: Promise<any>) {
    this.cleanupPromises.push(promise);
  }

  static async cleanup() {
    if (this.instance && !this.isShuttingDown) {
      this.isShuttingDown = true;

      try {
        if (this.cleanupPromises.length > 0) {
          await Promise.race([
            Promise.all(this.cleanupPromises),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Cleanup timeout')), 5000),
            ),
          ]).catch(() => console.warn('Some cleanup promises timed out'));
          this.cleanupPromises = [];
        }

        const quitPromise = this.instance.quit();
        await Promise.race([
          quitPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis quit timeout')), 2000),
          ),
        ]).catch(() => {
          console.warn('Redis quit timed out, forcing disconnect');
          this.instance?.disconnect();
        });
      } catch (error) {
        console.error('Error during Redis cleanup:', error);
        this.instance?.disconnect();
      } finally {
        this.instance = null;
        this.isShuttingDown = false;
      }
    }
  }
}
