"use client";

import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // Allows us to stagger the entrance
}

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
            className={cn(
                // The Glassmorphism Stack:
                "relative overflow-hidden rounded-xl",
                "border border-white/10",
                "bg-zinc-900/40 backdrop-blur-md", // Dark glass
                "shadow-lg shadow-black/40", // Depth
                "hover:border-white/20 hover:bg-zinc-800/50 transition-colors duration-300", // Interaction
                className
            )}
        >
            <div className="relative z-10 p-6 h-full flex flex-col">
                {children}
            </div>

            {/* Optional: Subtle top highlight for 3D effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
    );
}
