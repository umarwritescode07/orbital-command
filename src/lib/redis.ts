import "dotenv/config";
import Redis from "ioredis";

class InMemoryRedisMock {
  private store: Record<string, any> = {};

  async ping() {
    return "PONG";
  }

  async hgetall(key: string) {
    return this.store[key] || {};
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.store[key] || [];
    const actualStop = stop === -1 ? list.length : stop + 1;
    return list.slice(start, actualStop);
  }

  pipeline() {
    const pipelineActions: Array<() => void> = [];
    const pipelineObj = {
      lpush: (key: string, value: string) => {
        pipelineActions.push(() => {
          if (!this.store[key]) this.store[key] = [];
          this.store[key].unshift(value);
        });
        return pipelineObj;
      },
      ltrim: (key: string, start: number, stop: number) => {
        pipelineActions.push(() => {
          const list = this.store[key] || [];
          const actualStop = stop === -1 ? list.length : stop + 1;
          this.store[key] = list.slice(start, actualStop);
        });
        return pipelineObj;
      },
      hset: (key: string, ...args: any[]) => {
        pipelineActions.push(() => {
          if (!this.store[key]) this.store[key] = {};
          if (args.length === 1 && typeof args[0] === 'object') {
            Object.assign(this.store[key], args[0]);
          } else if (args.length === 2) {
            this.store[key][args[0]] = args[1];
          }
        });
        return pipelineObj;
      },
      exec: async () => {
        pipelineActions.forEach(action => action());
        return [];
      }
    };
    return pipelineObj;
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (event === "connect") {
      setTimeout(() => callback(), 0);
    }
    return this;
  }
}

const globalForRedis = globalThis as unknown as {
  redis: any;
};

const getRedisClient = (): any => {
  if (process.env.USE_MOCK_REDIS === "true") {
    console.log("ℹ️ Using in-memory Redis mock for local development.");
    return new InMemoryRedisMock();
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  client.on("connect", () => {
    console.log("📡 Redis connected successfully.");
  });

  client.on("error", (err) => {
    console.error("❌ Redis Client Connection Error:", err);
  });

  return client;
};

export const redis = globalForRedis.redis ?? getRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
