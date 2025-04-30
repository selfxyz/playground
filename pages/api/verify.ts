import { NextApiRequest, NextApiResponse } from 'next';
import { 
    getUserIdentifier, 
    SelfBackendVerifier, 
    countryCodes 
} from '@selfxyz/core';
import { kv } from '@vercel/kv';
import { SelfApp } from '@selfxyz/qrcode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { proof, publicSignals } = req.body;

            if (!proof || !publicSignals) {
                return res.status(400).json({ message: 'Proof and publicSignals are required' });
            }

            const userId = await getUserIdentifier(publicSignals);
            console.log("Extracted userId from verification result:", userId);

            // Default options
            // eslint-disable-next-line prefer-const
            let minimumAge;
            // eslint-disable-next-line prefer-const
            let excludedCountryList: string[] = [];
            // eslint-disable-next-line prefer-const
            let enableOfac = false;
            // eslint-disable-next-line prefer-const
            let enabledDisclosures = {
                issuing_state: false,
                name: false,
                nationality: false,
                date_of_birth: false,
                passport_number: false,
                gender: false,
                expiry_date: false
            };
            
            // Try to retrieve options from store using userId
            // if (userId) {
            //     const savedOptions = await kv.get(userId) as SelfApp["disclosures"];
            //     if (savedOptions) {
            //         console.log("Saved options:", savedOptions);
                    
            //         // Apply saved options
            //         minimumAge = savedOptions.minimumAge || minimumAge;
                    
            //         if (savedOptions.excludedCountries && savedOptions.excludedCountries.length > 0) {
            //             excludedCountryList = savedOptions.excludedCountries
            //         }
                    
            //         enableOfac = savedOptions.ofac !== undefined ? savedOptions.ofac : enableOfac;
                    
            //         // Apply all disclosure settings
            //         enabledDisclosures = {
            //             issuing_state: savedOptions.issuing_state !== undefined ? savedOptions.issuing_state : enabledDisclosures.issuing_state,
            //             name: savedOptions.name !== undefined ? savedOptions.name : enabledDisclosures.name,
            //             nationality: savedOptions.nationality !== undefined ? savedOptions.nationality : enabledDisclosures.nationality,
            //             date_of_birth: savedOptions.date_of_birth !== undefined ? savedOptions.date_of_birth : enabledDisclosures.date_of_birth,
            //             passport_number: savedOptions.passport_number !== undefined ? savedOptions.passport_number : enabledDisclosures.passport_number,
            //             gender: savedOptions.gender !== undefined ? savedOptions.gender : enabledDisclosures.gender,
            //             expiry_date: savedOptions.expiry_date !== undefined ? savedOptions.expiry_date : enabledDisclosures.expiry_date
            //         };
            //     } else {
            //         console.log("No saved options found for userId:", userId);
            //     }
            // } else {
            //     console.log("No userId found in verification result, using default options");
            // }
            
            const configuredVerifier = new SelfBackendVerifier(
                "self-playground",
                // "https://playground.self.xyz",
                "https://5ba4-219-104-171-120.ngrok-free.app",
                "uuid",
                true
            );
            
            if (minimumAge !== undefined) {
                configuredVerifier.setMinimumAge(minimumAge);
            }
            
            if (excludedCountryList.length > 0) {
                configuredVerifier.excludeCountries(
                    ...excludedCountryList as (keyof typeof countryCodes)[]
                );
            }
            
            if (enableOfac) {
                configuredVerifier.enableNameAndDobOfacCheck();
            }

            const result = await configuredVerifier.verify(proof, publicSignals);
            console.log("Verification result:", result);

            if (result.isValid) {
                const filteredSubject = { ...result.credentialSubject };
                
                if (!enabledDisclosures.issuing_state && filteredSubject) {
                    filteredSubject.issuing_state = "Not disclosed";
                }
                if (!enabledDisclosures.name && filteredSubject) {
                    filteredSubject.name = "Not disclosed";
                }
                if (!enabledDisclosures.nationality && filteredSubject) {
                    filteredSubject.nationality = "Not disclosed";
                }
                if (!enabledDisclosures.date_of_birth && filteredSubject) {
                    filteredSubject.date_of_birth = "Not disclosed";
                }
                if (!enabledDisclosures.passport_number && filteredSubject) {
                    filteredSubject.passport_number = "Not disclosed";
                }
                if (!enabledDisclosures.gender && filteredSubject) {
                    filteredSubject.gender = "Not disclosed";
                }
                if (!enabledDisclosures.expiry_date && filteredSubject) {
                    filteredSubject.expiry_date = "Not disclosed";
                }
                
                res.status(200).json({
                    status: 'success',
                    result: result.isValid,
                    credentialSubject: filteredSubject,
                    verificationOptions: {
                        minimumAge,
                        ofac: enableOfac,
                        excludedCountries: excludedCountryList.map(countryName => {
                            const entry = Object.entries(countryCodes).find(([_, name]) => name === countryName);
                            return entry ? entry[0] : countryName;
                        })
                    }
                });
            } else {
                res.status(400).json({
                    status: 'error', 
                    result: result.isValid,
                    message: 'Verification failed',
                    details: result
                });
            }
        } catch (error) {
            console.error('Error verifying proof:', error);
            return res.status(500).json({ 
                message: 'Error verifying proof',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}