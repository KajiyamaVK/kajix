import { RedisHelper } from './redis.helper';

describe('RedisHelper', () => {
  // Add a jest timeout to ensure we have enough time for Redis operations
  jest.setTimeout(10000);

  beforeEach(async () => {
    // Reset the RedisHelper state before each test
    await RedisHelper.cleanup();
    // Add a small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // Clean up after each test
    await RedisHelper.cleanup();
    // Add a small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Ensure final cleanup
    await RedisHelper.cleanup();
    // Add a longer delay for final cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe('cleanup', () => {
    it('should properly clean up Redis connection', async () => {
      // Get an instance and verify it exists
      const redis = RedisHelper.getInstance();
      expect(redis).toBeDefined();

      // Add a test cleanup promise
      const testPromise = new Promise((resolve) => setTimeout(resolve, 100));
      RedisHelper.addCleanupPromise(testPromise);

      // Test connection by setting a value
      await redis.set('test-key', 'test-value');
      const value = await redis.get('test-key');
      expect(value).toBe('test-value');

      // Call cleanup
      await RedisHelper.cleanup();
      // Add a small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify instance is nullified
      // @ts-ignore - accessing private property for testing
      expect(RedisHelper['instance']).toBeNull();

      // Verify connection is closed by trying to use it
      try {
        await redis.get('test-key');
        fail('Should have thrown an error because connection is closed');
      } catch (error) {
        expect(error.message).toContain('Connection is closed');
      }
    });

    it('should handle cleanup when no instance exists', async () => {
      // @ts-ignore - accessing private property for testing
      expect(RedisHelper['instance']).toBeNull();

      // Should not throw error when cleaning up without instance
      await expect(RedisHelper.cleanup()).resolves.not.toThrow();
    });

    it('should handle multiple cleanup calls', async () => {
      const redis = RedisHelper.getInstance();
      expect(redis).toBeDefined();

      // Multiple cleanup calls should not throw errors
      await RedisHelper.cleanup();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await RedisHelper.cleanup();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await RedisHelper.cleanup();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // @ts-ignore - accessing private property for testing
      expect(RedisHelper['instance']).toBeNull();
    });

    it('should process cleanup promises before closing connection', async () => {
      const redis = RedisHelper.getInstance();

      // Add a cleanup promise that sets a value
      const cleanupPromise = redis.set('cleanup-test', 'cleanup-value');
      RedisHelper.addCleanupPromise(cleanupPromise);

      // Start cleanup
      const cleanupProcess = RedisHelper.cleanup();

      // Verify the cleanup promise was processed
      await cleanupProcess;
      // Add a small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // @ts-ignore - accessing private property for testing
      expect(RedisHelper['instance']).toBeNull();
    });
  });
});
