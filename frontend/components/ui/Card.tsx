'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`
        rounded-2xl 
        bg-[var(--glass-bg)] 
        backdrop-blur-[8px]
        border border-[var(--glass-border)]
        shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        ${paddingMap[padding]}
        ${hover ? 'hover:bg-[var(--glass-shine)] hover:border-white/20 cursor-pointer' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardStatic({
  children,
  padding = 'md',
  className = ''
}: Omit<CardProps, 'hover'>) {
  return (
    <div className={`rounded-2xl bg-[#161B22] border border-white/[0.06] ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  );
}
