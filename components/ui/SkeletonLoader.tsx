import { motion } from "motion/react";

export function SkeletonLoader() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: Math.min(i * 0.05, 0.5), // Cap delay
            ease: "easeOut",
          }}
          className="flex flex-col gap-2 p-2"
        >
          {/* Image Placeholder */}
          <motion.div 
            className="aspect-square w-full rounded-md bg-secondary overflow-hidden"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Text Placeholders */}
          <div className="space-y-1.5 mt-1">
            <motion.div 
              className="h-4 w-3/4 bg-secondary rounded"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <div className="flex justify-between items-center">
              <motion.div 
                className="h-3 w-1/4 bg-secondary rounded"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
              <div className="flex gap-1">
                <motion.div 
                  className="h-3 w-8 bg-secondary rounded-full"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
