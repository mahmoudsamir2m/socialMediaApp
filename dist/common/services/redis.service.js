"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const redis_1 = require("redis");
const env_service_1 = require("../../config/env.service");
const applications_exceptions_1 = require("../exceptions/applications.exceptions");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: env_service_1.env.REDIS_URI,
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
    connect() {
        this.client.connect();
        console.log("Connected to Redis");
    }
    createRevokeKey = ({ userId, token, }) => {
        return `revokeToken::${userId}::${token}`;
    };
    set = async ({ key, value, ttl, nx, }) => {
        if (typeof value == "object") {
            value = JSON.stringify(value);
        }
        return this.client.set(key, value, {
            ...(ttl ? { EX: ttl } : {}),
            ...(nx ? { NX: true } : {}),
        });
    };
    get = async (key) => {
        let data = await this.client.get(key);
        if (!data) {
            throw new applications_exceptions_1.NotFoundException("key not found");
        }
        try {
            data = JSON.parse(data);
        }
        catch (error) { }
        return data;
    };
    ttl = async (key) => {
        return await this.client.ttl(key);
    };
    exists = async (key) => {
        return await this.client.exists(key);
    };
    redis_delete = async (key) => {
        return await this.client.del(key);
    };
    mget = async (...keys) => {
        return await this.client.mGet(keys);
    };
    keys = async (prefix) => {
        return await this.client.keys(`${prefix}*`);
    };
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
