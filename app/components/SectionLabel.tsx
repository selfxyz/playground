'use client';

import React, { useState } from 'react';

interface SectionLabelProps {
    label: string;
    tooltip?: string;
}

export default function SectionLabel({ label, tooltip }: SectionLabelProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="flex items-center gap-[12px]">
            <span className="text-[14px] font-medium uppercase text-[#64748b]">
                {label}
            </span>
            {tooltip && (
                <div className="relative">
                    <div
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="w-[17px] h-[20px] flex items-center justify-center cursor-help text-[#94a3b8]"
                    >
                        <svg width="17" height="20" viewBox="0 0 17 20" fill="none">
                            <circle cx="8.5" cy="10" r="7.5" stroke="#94A3B8" strokeWidth="1.5" />
                            <text x="8.5" y="14.5" textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="600" fontFamily="system-ui">i</text>
                        </svg>
                    </div>
                    {showTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap z-10">
                            {tooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
