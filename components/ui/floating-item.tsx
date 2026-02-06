import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingItemProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FloatingItem = ({ 
  children, 
  delay = 0, 
  duration = 4,
  className = "" 
}: FloatingItemProps) => {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, rotate: 0 }}
      animate={{ 
        y: [-10, 10, -10],
        rotate: [-5, 5, -5]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};
