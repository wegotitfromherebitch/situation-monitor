"use client";

import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    variant?: "standard" | "hud"; // New variant prop
    onClick?: () => void;
}

export function GlassCard({ children, className, delay = 0, variant = "standard", onClick }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} // Less movement, faster feel
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden border backdrop-blur-md",
                // VARIANT LOGIC:
                variant === "standard" && "rounded-lg border-white/10 bg-zinc-900/60 shadow-lg",
                variant === "hud" && "rounded-sm border-emerald-500/20 bg-zinc-950/80 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
                className
            )}
        >
            {/* THE HUD CORNERS (Visual Tech Noise) */}
            {variant === "hud" && (
                <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-500/50 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-emerald-500/50 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-emerald-500/50 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-emerald-500/50 pointer-events-none" />
                </>
            )}

            <div className="relative z-10 p-4 h-full flex flex-col">
                {children}
            </div>

            {/* Scanline Effect (Optional texture) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] opacity-20 pointer-events-none bg-[length:100%_4px,3px_100%]" />
        </motion.div>
    );
}
