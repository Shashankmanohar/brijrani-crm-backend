import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const getRedisConnection = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    showFriendlyErrorStack: true,
    lazyConnect: true // Prevent immediate crashing if Redis is offline
  });
};

export const checkRedisHealth = async (): Promise<boolean> => {
  const client = getRedisConnection();
  try {
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch (err) {
    return false;
  }
};
