import { describe, expect, it } from 'vitest';

import type { SelfAppDisclosureConfig } from '@selfxyz/common';

import {
  applyDisclosureFilter,
  mapExcludedCountriesToCodes,
} from '@/lib/disclosure';

const allDisclosuresEnabled: SelfAppDisclosureConfig = {
  issuing_state: true,
  name: true,
  nationality: true,
  date_of_birth: true,
  passport_number: true,
  gender: true,
  expiry_date: true,
  minimumAge: 18,
  excludedCountries: [] as SelfAppDisclosureConfig['excludedCountries'],
  ofac: true,
};

describe('applyDisclosureFilter', () => {
  it('preserves fields the user opted to disclose', () => {
    const filtered = applyDisclosureFilter(
      {
        issuingState: 'CA',
        name: 'Alice',
        nationality: 'USA',
        dateOfBirth: '2000-01-01',
        idNumber: '123',
        gender: 'F',
        expiryDate: '2030-01-01',
        extraField: 'kept',
      },
      allDisclosuresEnabled,
    );

    expect(filtered).toEqual({
      issuingState: 'CA',
      name: 'Alice',
      nationality: 'USA',
      dateOfBirth: '2000-01-01',
      idNumber: '123',
      gender: 'F',
      expiryDate: '2030-01-01',
      extraField: 'kept',
    });
  });

  it('redacts every field the user opted out of disclosing', () => {
    const filtered = applyDisclosureFilter(
      {
        issuingState: 'CA',
        name: 'Alice',
        nationality: 'USA',
        dateOfBirth: '2000-01-01',
        idNumber: '123',
        gender: 'F',
        expiryDate: '2030-01-01',
      },
      {
        ...allDisclosuresEnabled,
        issuing_state: false,
        name: false,
        nationality: false,
        date_of_birth: false,
        passport_number: false,
        gender: false,
        expiry_date: false,
      },
    );

    expect(filtered).toEqual({
      issuingState: 'Not disclosed',
      name: 'Not disclosed',
      nationality: 'Not disclosed',
      dateOfBirth: 'Not disclosed',
      idNumber: 'Not disclosed',
      gender: 'Not disclosed',
      expiryDate: 'Not disclosed',
    });
  });

  it('handles an empty credential subject without throwing', () => {
    expect(applyDisclosureFilter(undefined, allDisclosuresEnabled)).toEqual({});
  });
});

describe('mapExcludedCountriesToCodes', () => {
  it('maps known countries to ISO codes and leaves unknown names untouched', () => {
    expect(
      mapExcludedCountriesToCodes(['United States of America', 'Atlantis']),
    ).toEqual(['USA', 'Atlantis']);
  });

  it('returns undefined when there are no excluded countries', () => {
    expect(mapExcludedCountriesToCodes(undefined)).toBeUndefined();
  });
});
