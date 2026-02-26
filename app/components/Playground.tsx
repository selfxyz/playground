'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { countryCodes, SelfAppDisclosureConfig, type Country3LetterCode, SelfAppBuilder, getUniversalLink, type SelfApp } from '@selfxyz/sdk-common';
import { countries } from '@selfxyz/qrcode';
import Image from 'next/image';
import CircleCheckbox from './CircleCheckbox';
import SectionLabel from './SectionLabel';

const SelfQRcodeWrapper = dynamic(
    () => import('@selfxyz/qrcode').then((mod) => mod.SelfQRcodeWrapper),
    { ssr: false }
);

const SelfDeepLinkButton = dynamic(
    () => import('@selfxyz/qrcode').then((mod) => mod.SelfDeepLinkButton),
    { ssr: false }
);

function Playground() {
    const [userId, setUserId] = useState<string | null>(null);
    const [savingOptions, setSavingOptions] = useState(false);
    const [universalLink, setUniversalLink] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [isFetchingToken, setIsFetchingToken] = useState(false);
    const [appName, setAppName] = useState('Self Playground');
    const [appIconUrl, setAppIconUrl] = useState('https://image2url.com/r2/default/images/1772123009674-14365df5-cc03-433d-9c21-814d43ad2fb8.png');
    const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile' | 'alternates' | 'code'>('desktop');

    useEffect(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            setPreviewTab('mobile');
        }
    }, []);

    useEffect(() => {
        setUserId(uuidv4());
    }, []);

    const [disclosures, setDisclosures] = useState<SelfAppDisclosureConfig>({
        issuing_state: false,
        name: false,
        nationality: true,
        date_of_birth: false,
        passport_number: false,
        gender: false,
        expiry_date: false,
        minimumAge: 18,
        excludedCountries: [
            countries.IRAN,
            countries.IRAQ,
            countries.NORTH_KOREA,
            countries.RUSSIA,
            countries.SYRIAN_ARAB_REPUBLIC,
            countries.VENEZUELA
        ] as Country3LetterCode[],
        ofac: true,
    });

    const [showCountryModal, setShowCountryModal] = useState(false);
    const [selectedCountries, setSelectedCountries] = useState<Country3LetterCode[]>([
        countries.IRAN,
        countries.IRAQ,
        countries.NORTH_KOREA,
        countries.RUSSIA,
        countries.SYRIAN_ARAB_REPUBLIC,
        countries.VENEZUELA
    ]);
    const [countrySelectionError, setCountrySelectionError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showIconPopover, setShowIconPopover] = useState(false);
    const [iconUrlInput, setIconUrlInput] = useState(appIconUrl);

    const incrementAge = () => {
        setDisclosures(prev => ({
            ...prev,
            minimumAge: Math.min(99, (prev.minimumAge || 0) + 1)
        }));
    };

    const decrementAge = () => {
        setDisclosures(prev => ({
            ...prev,
            minimumAge: Math.max(0, (prev.minimumAge || 0) - 1)
        }));
    };

    const handleCountryToggle = (country: Country3LetterCode) => {
        setSelectedCountries(prev => {
            if (prev.includes(country)) {
                setCountrySelectionError(null);
                return prev.filter(c => c !== country);
            }
            if (prev.length >= 40) {
                setCountrySelectionError('Maximum 40 countries can be excluded');
                return prev;
            }
            return [...prev, country];
        });
    };

    const saveCountrySelection = () => {
        const codes = selectedCountries.map(countryName => {
            const entry = Object.entries(countryCodes).find(([_, name]) => name === countryName);
            return entry ? entry[0] : countryName.substring(0, 3).toUpperCase();
        }) as Country3LetterCode[];
        setDisclosures(prev => ({ ...prev, excludedCountries: codes }));
        setShowCountryModal(false);
    };

    const handleCheckboxChange = (field: string) => {
        setDisclosures(prev => ({
            ...prev,
            [field]: !prev[field as keyof typeof prev]
        }));
    };

    const saveOptionsToServer = useCallback(async () => {
        if (!userId) return;
        setSavingOptions(true);
        try {
            const response = await fetch('/api/saveOptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    options: {
                        minimumAge: disclosures.minimumAge && disclosures.minimumAge > 0 ? disclosures.minimumAge : undefined,
                        excludedCountries: disclosures.excludedCountries,
                        ofac: disclosures.ofac,
                        issuing_state: disclosures.issuing_state,
                        name: disclosures.name,
                        nationality: disclosures.nationality,
                        date_of_birth: disclosures.date_of_birth,
                        passport_number: disclosures.passport_number,
                        gender: disclosures.gender,
                        expiry_date: disclosures.expiry_date
                    }
                }),
            });
            console.log("saved options to server");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save options');
            }
        } catch (error) {
            console.error('Error saving options:', error);
            if (error instanceof Error && error.message) {
                alert(error.message);
            } else {
                alert('Failed to save verification options. Please try again.');
            }
        } finally {
            setSavingOptions(false);
        }
    }, [userId, disclosures.minimumAge, disclosures.excludedCountries, disclosures.ofac, disclosures.issuing_state, disclosures.name, disclosures.nationality, disclosures.date_of_birth, disclosures.passport_number, disclosures.gender, disclosures.expiry_date]);

    const disclosuresKey = useMemo(() => JSON.stringify(disclosures), [disclosures]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (userId) {
                saveOptionsToServer();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [userId, disclosuresKey, saveOptionsToServer]);

    const selfApp = useMemo(() => {
        if (!userId || !appName) return null;
        const app = new SelfAppBuilder({
            appName: appName,
            scope: "self-playground",
            endpoint: "https://playground.self.xyz/api/verify",
            endpointType: "https",
            logoBase64: appIconUrl,
            userId,
            disclosures: {
                ...disclosures,
                minimumAge: disclosures.minimumAge && disclosures.minimumAge > 0 ? disclosures.minimumAge : undefined,
            },
            version: 2,
            userDefinedData: "hello from the playground",
            devMode: false,
        } as Partial<SelfApp>).build();
        return app;
    }, [userId, disclosures, appName, appIconUrl]);

    useEffect(() => {
        if (selfApp) {
            setUniversalLink(getUniversalLink(selfApp));
        }
    }, [selfApp]);

    const sendPayload = async () => {
        try {
            const response = await fetch('/api/deferredLinking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaign_id: 'self-playground',
                    campaign_user_id: userId,
                    self_app: JSON.stringify(selfApp)
                }),
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch token: ${response.status}`);
            }
            const data = await response.json();
            return data.data || '';
        } catch (error) {
            console.error("Error fetching token:", error);
            return '';
        }
    };

    useEffect(() => {
        let cancelled = false;
        const prefetch = async () => {
            if (!userId || !universalLink) return;
            if (token || isFetchingToken) return;
            setIsFetchingToken(true);
            const t = await sendPayload();
            if (!cancelled) {
                setToken(t || null);
            }
            setIsFetchingToken(false);
        };
        prefetch();
        return () => { cancelled = true; };
    }, [userId, universalLink]);

    const openSelfApp = async () => {
        if (!universalLink || !token) return;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        try {
            await navigator.clipboard.writeText(token);
        } catch (err) {
            console.error("Clipboard copy failed:", err);
            prompt("Copy this token manually:", token);
        }
        if (isMobile) {
            location.href = universalLink;
        } else {
            window.open(universalLink, "_blank");
        }
    };

    if (!userId) return null;

    const filteredCountries = Object.entries(countryCodes).filter(([_, country]) =>
        country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const previewTabs = [
        { id: 'desktop' as const, label: 'Desktop', enabled: true },
        { id: 'mobile' as const, label: 'Mobile', enabled: true },
        { id: 'alternates' as const, label: 'Alternates', enabled: false },
        { id: 'code' as const, label: 'Code Snippets', enabled: false },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white text-slate-900 font-din" suppressHydrationWarning>
            {/* Nav Bar */}
            <nav className="w-full bg-white border-b border-[#e2e8f0] px-[12px] py-[10px] flex items-center gap-[12px] md:px-[20px] md:gap-[30px] overflow-clip shrink-0">
                <div className="flex items-center shrink-0">
                    <Image width={80} height={30} src="/self.svg" alt="Self Logo" className="h-[30px] w-[80px]" />
                </div>
                <div className="flex-1 flex items-center gap-[8px]">
                    <span className="h-[36px] px-[16px] pt-[10px] pb-[14px] text-[14px] font-medium text-white bg-black rounded-[5px] flex items-center justify-center">Playground</span>
                    <a href="https://docs.self.xyz/quick-start" target="_blank" rel="noopener noreferrer" className="hidden md:flex h-[36px] px-[16px] pt-[10px] pb-[14px] text-[14px] font-medium text-[#64748b] rounded-[5px] hover:bg-slate-50 transition-colors items-center justify-center">Guides</a>
                    <a href="https://discord.gg/self" target="_blank" rel="noopener noreferrer" className="hidden md:flex h-[36px] px-[16px] pt-[10px] pb-[14px] text-[14px] font-medium text-[#64748b] rounded-[5px] hover:bg-slate-50 transition-colors items-center justify-center">Community</a>
                </div>
                <div className="flex items-center gap-[8px] shrink-0">
                    <a
                        href="https://github.com/selfxyz/self"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex h-[36px] px-[16px] border border-[#e2e8f0] rounded-[5px] items-center gap-[10px] text-[14px] font-medium text-[#64748b] bg-white hover:bg-slate-50 transition-colors"
                    >
                        <span>Star on Github</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                    </a>
                    <a
                        href="https://docs.self.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-[36px] px-[12px] md:px-[16px] py-[8px] bg-[#0f172a] text-white rounded-[6px] flex items-center text-[13px] md:text-[14px] font-bold hover:bg-slate-800 transition-colors"
                    >
                        Docs
                    </a>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row pt-[10px] px-[12px] pb-[40px] md:pr-[20px] md:px-0 rounded-[10px] w-full">
                {/* Left Column - Config */}
                <div className="w-full lg:w-[530px] lg:shrink-0 overflow-y-auto flex flex-col gap-[20px] px-[16px] py-[30px] md:gap-[30px] md:px-[40px] md:py-[60px]">
                    {/* Title */}
                    <div className="pb-[20px]">
                        <h1 className="font-advercase text-[28px] font-normal text-black tracking-[1px]">Proof Request Playground</h1>
                        <p className="text-[14px] font-medium text-[#64748b] mt-[4px] max-w-[380px]">Configure these parameters to dynamically generate a unique QR for testing with the Self Mobile app in Dev Mode.</p>
                    </div>

                    {/* App Name */}
                    <div className="flex flex-col gap-[10px]">
                        <SectionLabel label="Name of Test Application" tooltip="This name appears in the Self app when users scan the QR code" />
                        <div className="flex items-center h-[36px] px-[16px] border border-[#e2e8f0] rounded-[5px] bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] gap-[10px]">
                            <input
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value.slice(0, 54))}
                                className="flex-1 text-[14px] font-medium text-black bg-transparent focus:outline-none placeholder:text-[#94a3b8]"
                                placeholder="Multipass"
                                maxLength={54}
                            />
                            <span className="text-[12px] font-medium text-[#94a3b8] shrink-0">
                                54 character limit
                            </span>
                        </div>
                    </div>

                    {/* App Icon */}
                    <div className="flex flex-col gap-[10px]">
                        <SectionLabel label="Test Application Icon" tooltip="Icon displayed alongside your app name" />
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] flex gap-[12px] items-end overflow-clip pb-[20px] pl-[20px] pt-[50px] relative">
                            <div className="flex-1 flex flex-col gap-[12px] items-start pr-[30px] max-w-[220px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={appIconUrl}
                                    alt="App icon"
                                    width={36}
                                    height={36}
                                    className="w-[36px] h-[36px] rounded-[3px] shrink-0 object-cover"
                                />
                                <div className="flex flex-col gap-[12px] w-full">
                                    <button
                                        onClick={() => {
                                            setIconUrlInput(appIconUrl);
                                            setShowIconPopover(prev => !prev);
                                        }}
                                        className="h-[36px] px-[16px] text-[14px] font-medium bg-black text-white rounded-[5px] hover:bg-slate-800 transition-colors shrink-0 w-fit"
                                    >
                                        Replace icon
                                    </button>
                                    <p className="text-[12px] font-medium text-[#94a3b8]">
                                        400 x 400 pixels. Displayed to users during proof requests.
                                    </p>
                                </div>
                            </div>
                            <Image
                                src="/phone.png"
                                alt="Phone mockup preview"
                                width={968}
                                height={784}
                                className="absolute right-0 bottom-0 h-full w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="flex flex-col gap-[10px]">
                        <SectionLabel label="Personal Information" tooltip="Select which passport fields to request from the user" />
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] p-[16px] md:p-[20px]">
                            <div className="flex flex-col gap-[12px] sm:flex-row">
                                <div className="flex-1 flex flex-col gap-[12px]">
                                    <CircleCheckbox
                                        checked={!!disclosures.issuing_state}
                                        onChange={() => handleCheckboxChange('issuing_state')}
                                        label="Disclose Issuing State"
                                    />
                                    <CircleCheckbox
                                        checked={!!disclosures.name}
                                        onChange={() => handleCheckboxChange('name')}
                                        label="Disclose Name"
                                    />
                                    <CircleCheckbox
                                        checked={!!disclosures.nationality}
                                        onChange={() => handleCheckboxChange('nationality')}
                                        label="Disclose Nationality"
                                    />
                                    <CircleCheckbox
                                        checked={!!disclosures.date_of_birth}
                                        onChange={() => handleCheckboxChange('date_of_birth')}
                                        label="Disclose Date of Birth"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-[12px]">
                                    <CircleCheckbox
                                        checked={!!disclosures.passport_number}
                                        onChange={() => handleCheckboxChange('passport_number')}
                                        label="Disclose Passport Number"
                                    />
                                    <CircleCheckbox
                                        checked={!!disclosures.gender}
                                        onChange={() => handleCheckboxChange('gender')}
                                        label="Disclose Gender"
                                    />
                                    <CircleCheckbox
                                        checked={!!disclosures.expiry_date}
                                        onChange={() => handleCheckboxChange('expiry_date')}
                                        label="Disclose Expiry Date"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Rules */}
                    <div className="flex flex-col gap-[10px]">
                        <SectionLabel label="Verification Rules" tooltip="Set additional verification requirements beyond disclosure" />
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] p-[16px] md:p-[20px] flex flex-col gap-[22px] w-full md:w-fit">
                            {/* Minimum Age */}
                            <div className="border-b border-[#cbd5e1] pb-[20px] flex flex-col gap-[10px]">
                                <span className="text-[14px] font-medium text-black uppercase">Minimum Age</span>
                                <div className="flex items-center gap-[6px]">
                                    <button
                                        onClick={incrementAge}
                                        className="flex items-center justify-center hover:opacity-80 transition-opacity"
                                    >
                                        <Image src="/arrow.png" alt="Increase age" width={31} height={31} className="w-[31px] h-[31px]" />
                                    </button>
                                    <div className="h-[55px] px-[16px] flex items-center border border-[#e2e8f0] rounded-[5px] bg-white">
                                        <span className="text-[24px] font-medium text-black">{disclosures.minimumAge || 0}</span>
                                    </div>
                                    <button
                                        onClick={decrementAge}
                                        className="flex items-center justify-center hover:opacity-80 transition-opacity"
                                    >
                                        <Image src="/arrow.png" alt="Decrease age" width={31} height={31} className="w-[31px] h-[31px] rotate-180" />
                                    </button>
                                </div>
                                <p className="text-[12px] font-medium text-[#94a3b8]">Set to 0 to disable age requirement</p>
                            </div>

                            {/* OFAC & Excluded Countries */}
                            <div className="flex flex-col gap-[10px]">
                                <span className="text-[14px] font-medium text-black uppercase">Enable OFAC Check</span>
                                <CircleCheckbox
                                    checked={!!disclosures.ofac}
                                    onChange={() => handleCheckboxChange('ofac')}
                                    label="OFAC check enabled"
                                />
                                <button
                                    onClick={() => setShowCountryModal(true)}
                                    className="h-[36px] px-[16px] text-[14px] font-medium bg-black text-white rounded-[5px] hover:bg-slate-800 transition-colors w-fit"
                                >
                                    Configure Excluded Countries
                                </button>
                                <p className="text-[12px] font-medium text-[#94a3b8]">
                                    {disclosures.excludedCountries && disclosures.excludedCountries.length > 0
                                        ? `${disclosures.excludedCountries.length} countries excluded`
                                        : 'No countries excluded'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Preview */}
                <div className="flex-1 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0] flex flex-col items-center pt-[10px] pb-[20px] min-h-[400px] md:min-h-[600px]">
                    {/* Preview Tab Bar */}
                    <div className="flex flex-col gap-[8px] px-[12px] pt-[10px] w-full shrink-0 md:flex-row md:items-center md:justify-end md:gap-[10px] md:px-[20px]">
                        <div className="flex items-center gap-[12px] h-[36px] overflow-x-auto md:flex-1 md:gap-[20px]">
                            <span className="text-[12px] md:text-[14px] font-medium text-black uppercase tracking-[0.98px] shrink-0">preview:</span>
                            {previewTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => tab.enabled && setPreviewTab(tab.id)}
                                    className={`h-full flex items-center text-[13px] md:text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 ${previewTab === tab.id
                                        ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                                        : tab.enabled
                                            ? 'text-[#94a3b8] hover:text-slate-700'
                                            : 'text-[#94a3b8] cursor-not-allowed'
                                        }`}
                                    disabled={!tab.enabled}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {/* <button
                            className="hidden md:flex h-[36px] px-[16px] py-[8px] text-[14px] font-bold bg-[#2563eb] text-white rounded-[6px] hover:bg-blue-700 transition-colors shrink-0"
                        >
                            Connect a Wallet
                        </button> */}
                    </div>

                    {/* QR Code Area */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        {selfApp ? (
                            <>
                                <SelfQRcodeWrapper
                                    key={JSON.stringify(selfApp)}
                                    variant={previewTab === 'mobile' ? 'mobile' : 'desktop'}
                                    selfApp={selfApp}
                                    onSuccess={() => console.log('Verification successful')}
                                    darkMode={false}
                                    onError={() => console.error('Error generating QR code')}
                                />
                                {previewTab === 'mobile' && universalLink && (
                                    <div className="mt-[40px] min-w-[300px]">
                                        <SelfDeepLinkButton href={universalLink} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                </svg>
                                Loading QR Code...
                            </div>
                        )}
                    </div>

                    {/* Preview Footer */}
                    <div className="flex flex-col gap-[10px] items-center shrink-0">
                        <span className="text-[12px] text-[#94a3b8] font-ibm-mono font-medium text-center">
                            User ID: {userId.substring(0, 8)}...
                        </span>
                        <div className="bg-[#94a3b8] px-[6px] py-[4px] rounded-[4px]">
                            <span className="text-[12px] font-medium text-white text-center">
                                TEST INSTRUCTIONS: Scan QR code to test configuration
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Icon URL Popover */}
            {showIconPopover && (
                <div className="fixed inset-0 z-50" onClick={() => setShowIconPopover(false)}>
                    <div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[#e2e8f0] rounded-[6px] shadow-lg p-[16px] flex flex-col gap-[12px] w-[360px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <label className="text-[13px] font-medium text-black">Icon URL (PNG, 400x400)</label>
                        <input
                            type="url"
                            value={iconUrlInput}
                            onChange={(e) => setIconUrlInput(e.target.value)}
                            placeholder="https://example.com/icon.png"
                            className="h-[36px] px-[12px] border border-[#e2e8f0] rounded-[5px] text-[13px] text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && iconUrlInput.trim()) {
                                    setAppIconUrl(iconUrlInput.trim());
                                    setShowIconPopover(false);
                                }
                                if (e.key === 'Escape') setShowIconPopover(false);
                            }}
                        />
                        <div className="flex gap-[8px] justify-end">
                            <button
                                onClick={() => setShowIconPopover(false)}
                                className="h-[32px] px-[12px] text-[13px] font-medium border border-[#e2e8f0] rounded-[5px] text-[#64748b] hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (iconUrlInput.trim()) {
                                        setAppIconUrl(iconUrlInput.trim());
                                        setShowIconPopover(false);
                                    }
                                }}
                                className="h-[32px] px-[12px] text-[13px] font-medium bg-black text-white rounded-[5px] hover:bg-slate-800 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Country Selection Modal */}
            {showCountryModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-[10px] shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-semibold text-slate-900">Exclude Countries</h3>
                            <button
                                onClick={() => setShowCountryModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-[5px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {countrySelectionError && (
                            <div className="mx-6 mt-4 p-2.5 bg-red-50 text-red-600 text-sm rounded-[5px]">
                                {countrySelectionError}
                            </div>
                        )}

                        <div className="px-6 pt-4">
                            <input
                                type="text"
                                placeholder="Search countries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 px-3 border border-slate-200 rounded-[5px] text-sm text-slate-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                                {filteredCountries.map(([code, country]) => (
                                    <label
                                        key={code}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-[5px] hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCountries.includes(code as Country3LetterCode)}
                                            onChange={() => handleCountryToggle(code as Country3LetterCode)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedCountries.includes(code as Country3LetterCode)
                                                ? 'bg-blue-600'
                                                : 'border-2 border-slate-300'
                                                }`}
                                        >
                                            {selectedCountries.includes(code as Country3LetterCode) && (
                                                <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-slate-700">{country}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
                            <span className="text-xs text-slate-400">
                                {selectedCountries.length} selected (max 40)
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowCountryModal(false)}
                                    className="h-9 px-4 text-sm border border-slate-200 rounded-[5px] text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveCountrySelection}
                                    className="h-9 px-4 text-sm font-medium bg-blue-600 text-white rounded-[5px] hover:bg-blue-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Playground;
