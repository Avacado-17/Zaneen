import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ZaneenLogo from "./ZaneenLogo.tsx";
import { Loader2, ShieldCheck, Cpu, KeyRound } from "lucide-react";

interface SplashLoaderProps {
  onComplete: () => void;
}

export default function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing Zaneen Suite...");
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage-based loading updates for a realistic, secure, high-tech enterprise feel
    const stages = [
      { min: 0, max: 25, text: "Molding claymorphic interface grids..." },
      { min: 25, max: 55, text: "Syncing secure database templates..." },
      { min: 55, max: 80, text: "Verifying multi-factor firewall layers..." },
      { min: 80, max: 100, text: "Zaneen engine successfully authorized!" }
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 2;
        if (next >= 100) {
          clearInterval(interval);
          setStatusText(stages[3].text);
          setStage(3);
          // Wait a bit at 100% to let the user enjoy the finished state before transition
          setTimeout(() => {
            onComplete();
          }, 800);
          return 100;
        }

        // Determine current status message
        const currentStage = stages.find(s => next >= s.min && next < s.max);
        if (currentStage && currentStage.text !== statusText) {
          setStatusText(currentStage.text);
          setStage(stages.indexOf(currentStage));
        }

        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete, statusText]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#FAF4ED] text-[#401a07]"
      id="splash-loader-overlay"
    >
      <div className="flex flex-col items-center justify-center max-w-sm w-full text-center gap-8" id="splash-loader-content">
        {/* Animated logo wrapper */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
          id="splash-logo-animate"
        >
          {/* Pulsing halo background to make the logo feel alive */}
          <div className="absolute inset-0 bg-[#b67148]/5 rounded-full blur-3xl scale-125 animate-pulse" />
          <ZaneenLogo size={160} showText={true} textColorClass="text-[#401a07] font-semibold text-xl" />
        </motion.div>

        {/* Loading Progress & Status details */}
        <div className="w-full flex flex-col items-center gap-4 mt-4" id="splash-progress-section">
          <div className="w-full h-1.5 bg-[#ebdacf] rounded-full overflow-hidden p-[1px] shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[#b67148] via-[#8d4b26] to-[#401a07] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>

          <div className="flex items-center justify-between w-full text-xs font-mono text-[#8d4b26]/80 px-1 font-semibold">
            <span className="flex items-center gap-1.5">
              {stage === 0 && <Cpu className="w-3.5 h-3.5 animate-spin text-[#b67148]" />}
              {stage === 1 && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8d4b26]" />}
              {stage === 2 && <KeyRound className="w-3.5 h-3.5 text-[#5d2c12]" />}
              {stage === 3 && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
              {statusText}
            </span>
            <span className="tabular-nums font-bold text-[#401a07]">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Decorative Brand Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 text-[11px] font-mono tracking-widest uppercase text-[#8d4b26]"
        id="splash-footer-brand"
      >
        Tactile Scholarship Matching & Management
      </motion.div>
    </motion.div>
  );
}
