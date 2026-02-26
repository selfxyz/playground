'use client';

import React from 'react';

interface CircleCheckboxProps {
    checked: boolean;
    onChange: () => void;
    label: string;
}

export default function CircleCheckbox({ checked, onChange, label }: CircleCheckboxProps) {
    return (
        <label className="flex items-center gap-[6px] cursor-pointer select-none" onClick={onChange}>
            <div className="flex items-center justify-center shrink-0 w-[20px] h-[19px]">
                {checked ? (
                    <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
                        <circle cx="10" cy="9.5" r="9" fill="#2563EB" />
                        <path d="M6 9.5L9 12.5L14.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
                        <circle cx="10" cy="9.5" r="8.5" stroke="#CBD5E1" strokeWidth="1.5" />
                    </svg>
                )}
            </div>
            <span className="text-[14px] text-black">{label}</span>
        </label>
    );
}
