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
      });

      // Handle cleanup on process exit
      process.on('exit', () => {
        if (this.instance && !this.isShuttingDown) {
          this.instance.disconnect();
          this.instance = null;
        }
      });

      // Handle cleanup on SIGTERM and SIGINT
      process.on('SIGTERM', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
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
        // Wait for any pending operations to complete
        if (this.cleanupPromises.length > 0) {
          await Promise.all(this.cleanupPromises);
          this.cleanupPromises = [];
        }

        // Ensure all commands are processed before quitting
        await this.instance.quit();
      } catch (error) {
        console.error('Error during Redis cleanup:', error);
      } finally {
        this.instance = null;
        this.isShuttingDown = false;
      }
    }
  }
}