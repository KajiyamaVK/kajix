import { RedisHelper } from './helpers/redis.helper';

export default async function () {
  try {
    // Clean up Redis connections with a timeout
    await Promise.race([
      RedisHelper.cleanup(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Global teardown timeout')), 5000))
    ]).catch((error) => {
      console.warn('Teardown warning:', error.message);
    });
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
} 