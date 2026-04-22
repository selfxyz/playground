import { IConfigStorage, VerificationConfig } from "@selfxyz/core";
import { Redis } from "@upstash/redis";

const TTL_SECONDS = 1800;

export class KVConfigStore implements IConfigStorage {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token });
  }

  async getActionId(userIdentifier: string): Promise<string> {
    return userIdentifier;
  }

  async setConfig(id: string, config: VerificationConfig): Promise<boolean> {
    await this.redis.setex(id, TTL_SECONDS, JSON.stringify(config));
    return true;
  }

  async getConfig(id: string): Promise<VerificationConfig> {
    return (await this.redis.get(id)) as VerificationConfig;
  }
}

type MemoryEntry = { config: VerificationConfig; expiresAt: number };
const memoryStore: Map<string, MemoryEntry> =
  (globalThis as any).__selfPlaygroundMemoryStore ??
  ((globalThis as any).__selfPlaygroundMemoryStore = new Map());

export class InMemoryConfigStore implements IConfigStorage {
  async getActionId(userIdentifier: string): Promise<string> {
    return userIdentifier;
  }

  async setConfig(id: string, config: VerificationConfig): Promise<boolean> {
    memoryStore.set(id, {
      config,
      expiresAt: Date.now() + TTL_SECONDS * 1000,
    });
    return true;
  }

  async getConfig(id: string): Promise<VerificationConfig> {
    const entry = memoryStore.get(id);
    if (!entry) return undefined as unknown as VerificationConfig;
    if (entry.expiresAt < Date.now()) {
      memoryStore.delete(id);
      return undefined as unknown as VerificationConfig;
    }
    return entry.config;
  }
}

let warnedAboutFallback = false;

export function createConfigStore(): IConfigStorage {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return new KVConfigStore(url, token);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "KV_REST_API_URL and KV_REST_API_TOKEN must be set in production"
    );
  }
  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[playground] KV_REST_API_URL/TOKEN not set — using in-memory config store (dev only)"
    );
  }
  return new InMemoryConfigStore();
}
