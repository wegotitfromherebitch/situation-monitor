'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardHintsProps {
    show?: boolean;
}

export function KeyboardHints({ show = true }: KeyboardHintsProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Show hints after a short delay
        const timer = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!show || !visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-4 left-4 z-40"
            >
                <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-lg text-[10px] font-mono text-zinc-600">
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold">ESC</kbd>
                        <span>Close</span>
                    </span>
                    <span className="w-px h-3 bg-zinc-800" />
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-bold">?</kbd>
                        <span>Help</span>
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
