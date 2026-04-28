import type { SelfAppDisclosureConfig } from '@selfxyz/common';
import { countryCodes } from '@selfxyz/core';

type DisclosedCredentialSubject = {
  issuingState?: string;
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  idNumber?: string;
  gender?: string;
  expiryDate?: string;
  [key: string]: unknown;
};

export function applyDisclosureFilter(
  credentialSubject: DisclosedCredentialSubject | null | undefined,
  saveOptions: SelfAppDisclosureConfig,
): DisclosedCredentialSubject {
  const filteredSubject = { ...(credentialSubject ?? {}) };

  if (!saveOptions.issuing_state) {
    filteredSubject.issuingState = 'Not disclosed';
  }
  if (!saveOptions.name) {
    filteredSubject.name = 'Not disclosed';
  }
  if (!saveOptions.nationality) {
    filteredSubject.nationality = 'Not disclosed';
  }
  if (!saveOptions.date_of_birth) {
    filteredSubject.dateOfBirth = 'Not disclosed';
  }
  if (!saveOptions.passport_number) {
    filteredSubject.idNumber = 'Not disclosed';
  }
  if (!saveOptions.gender) {
    filteredSubject.gender = 'Not disclosed';
  }
  if (!saveOptions.expiry_date) {
    filteredSubject.expiryDate = 'Not disclosed';
  }

  return filteredSubject;
}

export function mapExcludedCountriesToCodes(
  excludedCountries: string[] | undefined,
) {
  return excludedCountries?.map(countryName => {
    const entry = Object.entries(countryCodes).find(
      ([_, name]) => name === countryName,
    );
    return entry ? entry[0] : countryName;
  });
}
