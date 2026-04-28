import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const constructorCalls: unknown[][] = [];

vi.mock('@selfxyz/core', () => {
  class FakeSelfBackendVerifier {
    constructor(...args: unknown[]) {
      constructorCalls.push(args);
    }
    async verify() {
      return {
        isValidDetails: {
          isValid: false,
          isMinimumAgeValid: false,
          isOfacValid: false,
        },
        userData: { userIdentifier: 'test-user' },
        discloseOutput: {},
      };
    }
  }
  return {
    AllIds: new Map(),
    SelfBackendVerifier: FakeSelfBackendVerifier,
    countryCodes: {},
  };
});

vi.mock('@/lib/configStore', () => ({
  createConfigStore: () => ({
    getActionId: async (id: string) => id,
    setConfig: async () => true,
    getConfig: async () => ({}),
  }),
}));

const env = process.env as Record<string, string | undefined>;
const original = {
  SELF_ENV: env.SELF_ENV,
  SELF_VERIFY_ENDPOINT_OVERRIDE: env.SELF_VERIFY_ENDPOINT_OVERRIDE,
  NODE_ENV: env.NODE_ENV,
};

function makeReqRes() {
  const req = {
    method: 'POST',
    body: {
      attestationId: 1,
      proof: {},
      publicSignals: [],
      userContextData: 'ctx',
    },
  } as unknown as NextApiRequest;

  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return { req, res: res as unknown as NextApiResponse };
}

beforeEach(() => {
  constructorCalls.length = 0;
});

afterEach(() => {
  env.SELF_ENV = original.SELF_ENV;
  env.SELF_VERIFY_ENDPOINT_OVERRIDE = original.SELF_VERIFY_ENDPOINT_OVERRIDE;
  env.NODE_ENV = original.NODE_ENV;
});

describe('pages/api/verify environment wiring', () => {
  it('uses the staging verify endpoint and mockPassport=true when SELF_ENV=staging', async () => {
    env.SELF_ENV = 'staging';
    delete env.SELF_VERIFY_ENDPOINT_OVERRIDE;

    const { default: handler } = await import('@/pages/api/verify');
    const { req, res } = makeReqRes();
    await handler(req, res);

    expect(constructorCalls).toHaveLength(1);
    const [, endpoint, mockPassport] = constructorCalls[0];
    expect(endpoint).toBe('https://playground.staging.self.xyz/api/verify');
    expect(mockPassport).toBe(true);
  });

  it('uses the production verify endpoint and mockPassport=false when SELF_ENV is unset in production', async () => {
    delete env.SELF_ENV;
    delete env.SELF_VERIFY_ENDPOINT_OVERRIDE;
    env.NODE_ENV = 'production';

    const { default: handler } = await import('@/pages/api/verify');
    const { req, res } = makeReqRes();
    await handler(req, res);

    expect(constructorCalls).toHaveLength(1);
    const [, endpoint, mockPassport] = constructorCalls[0];
    expect(endpoint).toBe('https://playground.self.xyz/api/verify');
    expect(mockPassport).toBe(false);
  });

  it('honors SELF_VERIFY_ENDPOINT_OVERRIDE over SELF_ENV defaults', async () => {
    env.SELF_ENV = 'staging';
    env.SELF_VERIFY_ENDPOINT_OVERRIDE = 'https://override.example/api/verify';

    const { default: handler } = await import('@/pages/api/verify');
    const { req, res } = makeReqRes();
    await handler(req, res);

    expect(constructorCalls).toHaveLength(1);
    const [, endpoint] = constructorCalls[0];
    expect(endpoint).toBe('https://override.example/api/verify');
  });
});
