import { NextApiRequest, NextApiResponse } from "next";
import { SelfAppDisclosureConfig } from "@selfxyz/common";
import {
  IConfigStorage,
  VerificationConfig,
  countryCodes,
  SelfBackendVerifier,
  AllIds,
} from "@selfxyz/core";
import { Redis } from "@upstash/redis";

export class KVConfigStore implements IConfigStorage {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({
      url: url,
      token: token,
    });
  }

  async getActionId(userIdentifier: string, data: string): Promise<string> {
    return userIdentifier;
  }

  async setConfig(id: string, config: VerificationConfig): Promise<boolean> {
    await this.redis.set(id, JSON.stringify(config));
    return true;
  }

  async getConfig(id: string): Promise<VerificationConfig> {
    const config = (await this.redis.get(id)) as VerificationConfig;
    return config;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { attestationId, proof, publicSignals, userContextData } = req.body;

      if (!proof || !publicSignals || !attestationId || !userContextData) {
        return res.status(400).json({
          message:
            "Proof, publicSignals, attestationId and userContextData are required",
        });
      }

      const configStore = new KVConfigStore(
        process.env.KV_REST_API_URL!,
        process.env.KV_REST_API_TOKEN!
      );

      const selfBackendVerifier = new SelfBackendVerifier(
        "self-playground",
        "https://playground.staging.self.xyz/api/verify",
        true,
        AllIds,
        configStore,
        "uuid"
      );

      const result = await selfBackendVerifier.verify(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );

      if (!result.isValidDetails.isMinimumAgeValid) {
        return res.status(200).json({
          status: "error",
          result: false,
          reason: "Minimum age verification failed",
          details: result.isValidDetails,
        });
      }

      if (!result.isValidDetails.isOfacValid) {
        return res.status(200).json({
          status: "error",
          result: false,
          reason: "OFAC verification failed",
          details: result.isValidDetails,
        });
      }

      if (!result.isValidDetails.isValid) {
        return res.status(200).json({
          status: "error",
          result: false,
          reason: "Verification failed",
          details: result.isValidDetails,
        });
      }

      const saveOptions = (await configStore.getConfig(
        result.userData.userIdentifier
      )) as unknown as SelfAppDisclosureConfig;

      if (result.isValidDetails.isValid) {
        const filteredSubject = { ...result.discloseOutput };

        if (!saveOptions.issuing_state && filteredSubject) {
          filteredSubject.issuingState = "Not disclosed";
        }
        if (!saveOptions.name && filteredSubject) {
          filteredSubject.name = "Not disclosed";
        }
        if (!saveOptions.nationality && filteredSubject) {
          filteredSubject.nationality = "Not disclosed";
        }
        if (!saveOptions.date_of_birth && filteredSubject) {
          filteredSubject.dateOfBirth = "Not disclosed";
        }
        if (!saveOptions.passport_number && filteredSubject) {
          filteredSubject.idNumber = "Not disclosed";
        }
        if (!saveOptions.gender && filteredSubject) {
          filteredSubject.gender = "Not disclosed";
        }
        if (!saveOptions.expiry_date && filteredSubject) {
          filteredSubject.expiryDate = "Not disclosed";
        }

        res.status(200).json({
          status: "success",
          result: result.isValidDetails.isValid,
          credentialSubject: filteredSubject,
          verificationOptions: {
            minimumAge: saveOptions.minimumAge,
            ofac: saveOptions.ofac,
            excludedCountries: saveOptions.excludedCountries?.map(
              (countryName) => {
                const entry = Object.entries(countryCodes).find(
                  ([_, name]) => name === countryName
                );
                return entry ? entry[0] : countryName;
              }
            ),
          },
        });
      } else {
        res.status(200).json({
          status: "error",
          result: result.isValidDetails.isValid,
          reason: "Proof verification failed",
          details: result,
        });
      }
    } catch (error) {
      console.error("Error verifying proof:", error);
      return res.status(200).json({
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
