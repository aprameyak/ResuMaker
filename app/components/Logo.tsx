import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#1D4ED8', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="logoDocGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#FFFFFF', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#F8FAFC', stopOpacity: 1}} />
            </linearGradient>
            <linearGradient id="logoAiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#F59E0B', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#D97706', stopOpacity: 1}} />
            </linearGradient>
          </defs>
          
          <circle cx="16" cy="16" r="16" fill="url(#logoBgGradient)"/>
          
          <rect x="8" y="6" width="16" height="20" rx="1.5" fill="url(#logoDocGradient)" stroke="#E2E8F0" strokeWidth="0.5"/>
          
          <rect x="9" y="7" width="14" height="3" rx="0.75" fill="#3B82F6" opacity="0.1"/>
          <rect x="10" y="8" width="12" height="1" rx="0.5" fill="#3B82F6"/>
          
          <rect x="10" y="11" width="12" height="0.75" rx="0.375" fill="#64748B"/>
          <rect x="10" y="12.5" width="10" height="0.75" rx="0.375" fill="#64748B"/>
          <rect x="10" y="14" width="11" height="0.75" rx="0.375" fill="#64748B"/>
          
          <path d="M22 8L23 7L22 6L21 7L22 8Z" fill="url(#logoAiGradient)"/>
          <path d="M24 12L25 11L24 10L23 11L24 12Z" fill="url(#logoAiGradient)"/>
          <path d="M20 12L21 11L20 10L19 11L20 12Z" fill="url(#logoAiGradient)"/>
          
          <circle cx="24" cy="9" r="0.25" fill="#10B981"/>
          <circle cx="25" cy="10" r="0.2" fill="#10B981"/>
          
          <path d="M24 6L26 8L24 10V6Z" fill="#E5E7EB"/>
          <path d="M24 6L26 8L24 10V6Z" fill="url(#logoDocGradient)" opacity="0.8"/>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${textSizes[size]}`}>
          ResuMaker
        </span>
      )}
    </div>
  );
};

export default Logo;
