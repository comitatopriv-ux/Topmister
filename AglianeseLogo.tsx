
import React from 'react';

interface AglianeseLogoProps {
    className?: string;
}

const AglianeseLogo: React.FC<AglianeseLogoProps> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#10C46A"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
    </svg>
);

export default AglianeseLogo;
