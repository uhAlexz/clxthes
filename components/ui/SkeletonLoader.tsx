"use client";

import { motion } from "motion/react";

export function SkeletonLoader() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
          className="flex flex-col"
        >
          <motion.div
            className="aspect-square w-full bg-card"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="px-3 pt-2.5 pb-3 space-y-1.5">
            <motion.div
              className="h-1.5 w-10 bg-card"
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
            <motion.div
              className="h-2.5 w-3/4 bg-card"
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div
              className="h-1.5 w-8 bg-card"
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
