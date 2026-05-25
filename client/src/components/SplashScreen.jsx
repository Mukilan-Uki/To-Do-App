import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const NOW_LETTERS = ['N', 'o', 'w'];

const TIMING = {
  doEnterMs: 280,
  nowDelayMs: 450,
  splashTotalMs: 2800,
  exitFadeMs: 380,
};

const nowContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.04,
    },
  },
};

const createLetterVariants = (index) => ({
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: [0, -7, 0],
    transition: {
      opacity: { duration: 0.28, ease: 'easeOut' },
      y: {
        repeat: Infinity,
        repeatType: 'loop',
        duration: 1.35,
        ease: 'easeInOut',
        delay: index * 0.14,
      },
    },
  },
});

/**
 * Splash screen: static "DO", then "Now" with per-letter bounce loops.
 */
const SplashScreen = ({ onComplete }) => {
  const { theme } = useTheme();
  const [doLocked, setDoLocked] = useState(false);
  const [showNow, setShowNow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const isDark = theme === 'dark';

  const accentClass = isDark ? 'text-blue-400' : 'text-blue-500';
  const doClass = isDark ? 'text-white' : 'text-[#1a3560]';
  const wordClass =
    'text-[2.75rem] sm:text-6xl md:text-7xl font-black tracking-tight leading-none select-none';

  useEffect(() => {
    const doTimer = setTimeout(() => setDoLocked(true), TIMING.doEnterMs);
    const nowTimer = setTimeout(() => setShowNow(true), TIMING.nowDelayMs);
    const exitTimer = setTimeout(
      () => setExiting(true),
      TIMING.splashTotalMs - TIMING.exitFadeMs
    );
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem('donow_splash_seen', '1');
      onComplete?.();
    }, TIMING.splashTotalMs);

    return () => {
      clearTimeout(doTimer);
      clearTimeout(nowTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: TIMING.exitFadeMs / 1000, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(165deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(165deg, #d8eff6 0%, #eef8fc 45%, #f8fcff 100%)',
      }}
      aria-label="Loading DoNow"
      role="status"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(59,130,246,0.18), transparent)'
            : 'radial-gradient(ellipse 66% 50% at 50% 35%, rgba(26,53,96,0.08), transparent)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 md:mb-9 relative z-10"
      >
        <div
          className="w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-2xl md:rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #1a3560 0%, #2563eb 100%)',
            boxShadow: isDark
              ? '0 16px 48px rgba(37, 99, 235, 0.3)'
              : '0 16px 40px rgba(26, 53, 96, 0.18)',
          }}
        >
          <span className="text-white font-black text-3xl md:text-4xl">D</span>
        </div>
      </motion.div>

      <div className="flex items-baseline justify-center px-4 relative z-10">
        {doLocked ? (
          <span className={`${wordClass} ${doClass}`}>DO</span>
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: TIMING.doEnterMs / 1000,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`${wordClass} ${doClass}`}
          >
            DO
          </motion.span>
        )}

        <AnimatePresence>
          {showNow && (
            <motion.span
              className={`inline-flex items-baseline ml-0.5 sm:ml-1 ${wordClass} ${accentClass}`}
              variants={nowContainerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              aria-label="Now"
            >
              {NOW_LETTERS.map((letter, index) => (
                <motion.span
                  key={`${letter}-${index}`}
                  variants={createLetterVariants(index)}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-32 sm:w-40 h-1 rounded-full overflow-hidden bg-black/[0.06] dark:bg-white/10 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: showNow ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: isDark ? '#60a5fa' : '#1a3560' }}
          initial={{ width: '0%' }}
          animate={{ width: exiting ? '100%' : showNow ? '90%' : '15%' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
