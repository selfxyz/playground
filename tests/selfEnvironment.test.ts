import { afterEach, describe, expect, it } from 'vitest';

import {
  getSelfEnvironment,
  getSelfEnvironmentConfig,
} from '@/lib/selfEnvironment';

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;

function setNodeEnv(value: string) {
  env.NODE_ENV = value;
}

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
});

describe('getSelfEnvironment', () => {
  it('returns staging for the explicit staging value', () => {
    setNodeEnv('production');

    expect(getSelfEnvironment('staging')).toBe('staging');
  });

  it('returns production for explicit production aliases', () => {
    setNodeEnv('development');

    expect(getSelfEnvironment('production')).toBe('production');
    expect(getSelfEnvironment('prod')).toBe('production');
  });

  it('defaults to staging when SELF_ENV is unset in development', () => {
    setNodeEnv('development');

    expect(getSelfEnvironment(undefined)).toBe('staging');
  });

  it('defaults to production when SELF_ENV is unset outside development', () => {
    setNodeEnv('production');

    expect(getSelfEnvironment(undefined)).toBe('production');
  });

  it('treats capitalized and whitespace-padded values as invalid input', () => {
    setNodeEnv('development');

    // Unrecognized values fall through to the NODE_ENV default; in dev that
    // happens to be 'staging', so we use a value that would otherwise resolve
    // to 'production' to actually prove the rejection path.
    expect(getSelfEnvironment('Production')).toBe('staging');
    expect(getSelfEnvironment(' production ')).toBe('staging');

    setNodeEnv('production');

    expect(getSelfEnvironment('Staging')).toBe('production');
    expect(getSelfEnvironment(' staging ')).toBe('production');
  });
});

describe('getSelfEnvironmentConfig', () => {
  it('returns the staging config when staging is selected', () => {
    const config = getSelfEnvironmentConfig('staging');

    expect(config).toMatchObject({
      defaultAppName: 'Self Playground',
      metadataTitle: 'Self Playground (Staging)',
      metadataDescription: 'Self Playground (Staging)',
      verifyEndpoint: 'https://playground.staging.self.xyz/api/verify',
      endpointType: 'staging_https',
      mockPassport: true,
      devMode: true,
    });
  });

  it('returns the production config when production is selected', () => {
    const config = getSelfEnvironmentConfig('production');

    expect(config).toMatchObject({
      defaultAppName: 'Self Playground',
      metadataTitle: 'Self Playground',
      metadataDescription: 'Self Playground',
      verifyEndpoint: 'https://playground.self.xyz/api/verify',
      endpointType: 'https',
      mockPassport: false,
      devMode: false,
    });
  });

  it('overrides only the verify endpoint when an override is present', () => {
    const config = getSelfEnvironmentConfig(
      'staging',
      'https://override.example/api/verify',
    );

    expect(config).toMatchObject({
      defaultAppName: 'Self Playground',
      metadataTitle: 'Self Playground (Staging)',
      metadataDescription: 'Self Playground (Staging)',
      verifyEndpoint: 'https://override.example/api/verify',
      endpointType: 'staging_https',
      mockPassport: true,
      devMode: true,
    });
  });
});
