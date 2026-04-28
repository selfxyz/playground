import type { EndpointType } from '@selfxyz/sdk-common';

export type SelfEnvironment = 'production' | 'staging';

type SelfEnvironmentConfig = {
  defaultAppName: string;
  metadataTitle: string;
  metadataDescription: string;
  verifyEndpoint: string;
  endpointType: EndpointType;
  mockPassport: boolean;
  devMode: boolean;
};

const STAGING_CONFIG: SelfEnvironmentConfig = {
  defaultAppName: 'Self Playground (Staging)',
  metadataTitle: 'Self Playground (Staging)',
  metadataDescription: 'Self Playground (Staging)',
  verifyEndpoint: 'https://playground.staging.self.xyz/api/verify',
  endpointType: 'staging_https',
  mockPassport: true,
  devMode: true,
};

const PRODUCTION_CONFIG: SelfEnvironmentConfig = {
  defaultAppName: 'Self Playground',
  metadataTitle: 'Self Playground',
  metadataDescription: 'Self Playground',
  verifyEndpoint: 'https://playground.self.xyz/api/verify',
  endpointType: 'https',
  mockPassport: false,
  devMode: false,
};

function normalizeEnvironment(
  value: string | undefined,
): SelfEnvironment | undefined {
  if (value === 'staging') return 'staging';
  if (value === 'production' || value === 'prod') return 'production';
  return undefined;
}

export function getSelfEnvironment(value: string | undefined): SelfEnvironment {
  const normalizedEnvironment = normalizeEnvironment(value);
  if (normalizedEnvironment) {
    return normalizedEnvironment;
  }

  return process.env.NODE_ENV === 'development' ? 'staging' : 'production';
}

export function getSelfEnvironmentConfig(
  value: string | undefined,
  verifyEndpointOverride?: string | undefined,
): SelfEnvironmentConfig {
  const baseConfig =
    getSelfEnvironment(value) === 'staging'
      ? STAGING_CONFIG
      : PRODUCTION_CONFIG;

  if (!verifyEndpointOverride) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    verifyEndpoint: verifyEndpointOverride,
  };
}
