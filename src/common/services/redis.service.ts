import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env.service";
import { Types } from "mongoose";
import { NotFoundException } from "../exceptions/applications.exceptions";

export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: env.REDIS_URI,
    });
    this.handleConnection();
  }
  handleConnection() {
    this.client.on("ready", () => {
      console.log("Connected to Redis");
    });
    this.client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }

  connect(): void {
    this.client.connect();
    console.log("Connected to Redis");
  }

  createRevokeKey = ({
    userId,
    token,
  }: {
    userId: Types.ObjectId;
    token: string;
  }): string => {
    return `revokeToken::${userId}::${token}`;
  };

  set = async ({
    key,
    value,
    ttl,
    nx,
  }: {
    key: string;
    value: any;
    ttl?: number;
    nx?: boolean;
  }): Promise<string | null> => {
    if (typeof value == "object") {
      value = JSON.stringify(value);
    }
    return this.client.set(key, value, {
      ...(ttl ? { EX: ttl } : {}),
      ...(nx ? { NX: true } : {}),
    });
  };

  get = async (key: string): Promise<string | null> => {
    let data = await this.client.get(key);
    if (!data) {
      throw new NotFoundException("key not found");
    }
    try {
      data = JSON.parse(data);
    } catch (error) {}
    return data;
  };

  ttl = async (key: string): Promise<number | null> => {
    return await this.client.ttl(key);
  };

  exists = async (key: string): Promise<number> => {
    return await this.client.exists(key);
  };

  redis_delete = async (key: string): Promise<number> => {
    return await this.client.del(key);
  };

  mget = async (...keys: string[]): Promise<(string | null)[]> => {
    return await this.client.mGet(keys);
  };

  keys = async (prefix: string): Promise<string[]> => {
    return await this.client.keys(`${prefix}*`);
  };
}

export const redisService = new RedisService();
