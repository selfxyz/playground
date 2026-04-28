import type { NextApiRequest, NextApiResponse } from 'next';

import type { SelfAppDisclosureConfig } from '@selfxyz/common';
import { AllIds, SelfBackendVerifier } from '@selfxyz/core';

import { createConfigStore } from '@/lib/configStore';
import {
  applyDisclosureFilter,
  mapExcludedCountriesToCodes,
} from '@/lib/disclosure';
import { getSelfEnvironmentConfig } from '@/lib/selfEnvironment';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    try {
      const { attestationId, proof, publicSignals, userContextData } = req.body;

      if (!proof || !publicSignals || !attestationId || !userContextData) {
        return res.status(400).json({
          message:
            'Proof, publicSignals, attestationId and userContextData are required',
        });
      }

      const configStore = createConfigStore();
      const environmentConfig = getSelfEnvironmentConfig(
        process.env.SELF_ENV,
        process.env.SELF_VERIFY_ENDPOINT_OVERRIDE,
      );

      const selfBackendVerifier = new SelfBackendVerifier(
        'self-playground',
        environmentConfig.verifyEndpoint,
        environmentConfig.mockPassport,
        AllIds,
        configStore,
        'uuid',
      );

      const result = await selfBackendVerifier.verify(
        attestationId,
        proof,
        publicSignals,
        userContextData,
      );

      if (!result.isValidDetails.isMinimumAgeValid) {
        return res.status(200).json({
          status: 'error',
          result: false,
          reason: 'Minimum age verification failed',
          details: result.isValidDetails,
        });
      }

      if (result.isValidDetails.isOfacValid) {
        return res.status(200).json({
          status: 'error',
          result: false,
          reason: 'OFAC verification failed',
          details: result.isValidDetails,
        });
      }

      if (!result.isValidDetails.isValid) {
        return res.status(200).json({
          status: 'error',
          result: false,
          reason: 'Verification failed',
          details: result.isValidDetails,
        });
      }

      const saveOptions = (await configStore.getConfig(
        result.userData.userIdentifier,
      )) as unknown as SelfAppDisclosureConfig;

      if (result.isValidDetails.isValid) {
        const filteredSubject = applyDisclosureFilter(
          result.discloseOutput,
          saveOptions,
        );

        res.status(200).json({
          status: 'success',
          result: result.isValidDetails.isValid,
          credentialSubject: filteredSubject,
          verificationOptions: {
            minimumAge: saveOptions.minimumAge,
            ofac: saveOptions.ofac,
            excludedCountries: mapExcludedCountriesToCodes(
              saveOptions.excludedCountries,
            ),
          },
        });
      } else {
        res.status(200).json({
          status: 'error',
          result: result.isValidDetails.isValid,
          reason: 'Proof verification failed',
          details: result,
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      return res.status(200).json({
        status: 'error',
        result: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
