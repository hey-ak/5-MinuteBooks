interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 64, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-2xl"
      >
        {/* Background */}
        <rect width="512" height="512" fill="#F5C842" rx="64"/>
        
        {/* Open Book */}
        <path 
          d="M114 184C114 184 114 184 114 184L114 368C114 384 126 396 142 396L256 396L370 396C386 396 398 384 398 368L398 184C398 184 398 184 398 184" 
          stroke="white" 
          strokeWidth="16" 
          fill="none"
        />
        
        {/* Book Pages */}
        <path 
          d="M114 184C114 184 180 140 256 140C332 140 398 184 398 184" 
          stroke="white" 
          strokeWidth="16" 
          fill="none"
        />
        <path 
          d="M256 140L256 396" 
          stroke="white" 
          strokeWidth="16"
        />
        
        {/* Clock Circle */}
        <circle 
          cx="256" 
          cy="280" 
          r="60" 
          stroke="#F5C842" 
          strokeWidth="12" 
          fill="white"
        />
        
        {/* Clock Hand */}
        <path 
          d="M256 240L256 280" 
          stroke="#F5C842" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        
        {/* Number 5 */}
        <text 
          x="290" 
          y="300" 
          fontFamily="Arial, sans-serif" 
          fontSize="48" 
          fontWeight="bold" 
          fill="#F5C842"
        >
          5
        </text>
        
        {/* Text */}
        <text 
          x="256" 
          y="450" 
          fontFamily="Arial, sans-serif" 
          fontSize="48" 
          fontWeight="bold" 
          fill="white" 
          textAnchor="middle"
        >
          5 MINUTE
        </text>
        <text 
          x="256" 
          y="490" 
          fontFamily="Arial, sans-serif" 
          fontSize="48" 
          fontWeight="bold" 
          fill="white" 
          textAnchor="middle"
        >
          BOOKS
        </text>
      </svg>
    </div>
  );
}