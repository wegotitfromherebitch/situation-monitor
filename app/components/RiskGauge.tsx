'use client';

import { useState, useEffect } from 'react';

export function RiskGauge({ severity }: { severity: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setDisplayValue(severity), 100);
        return () => clearTimeout(timer);
    }, [severity]);

    const getColor = () => {
        if (severity >= 80) return { stroke: 'stroke-red-500', text: 'text-red-400', label: 'CRITICAL' };
        if (severity >= 60) return { stroke: 'stroke-orange-500', text: 'text-orange-400', label: 'ELEVATED' };
        if (severity >= 40) return { stroke: 'stroke-yellow-500', text: 'text-yellow-400', label: 'WATCH' };
        return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', label: 'NOMINAL' };
    };

    const color = getColor();
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (displayValue / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-zinc-800"
                />
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className={`${color.stroke} transition-all duration-1000 ease-out`}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-bold ${color.text}`}>{Math.round(displayValue)}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{color.label}</div>
            </div>
        </div>
    );
}
