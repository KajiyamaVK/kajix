import { RedisHelper } from './helpers/redis.helper';

export default async function () {
  // Clean up Redis connections
  await RedisHelper.cleanup();
  
  // Add a delay to ensure Redis connections are fully closed
  await new Promise(resolve => setTimeout(resolve, 500));
} 