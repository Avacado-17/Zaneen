import React from "react";

interface ZaneenLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColorClass?: string;
  layout?: "vertical" | "horizontal";
}

export default function ZaneenLogo({
  className = "",
  size = 120,
  showText = true,
  textColorClass = "text-[#623a23]",
  layout = "vertical"
}: ZaneenLogoProps) {
  // We construct the 6-petal interwoven logo using 6 symmetrical rotated paths.
  // To achieve the realistic 3D ribbon overlapping "over-under" weave,
  // we can use radial/linear gradients on overlapping shapes.
  const isHorizontal = layout === "horizontal";
  
  return (
    <div 
      className={`flex ${isHorizontal ? "flex-row items-center gap-3" : "flex-col items-center justify-center"} ${className}`} 
      id="zaneen-logo-container"
    >
      <svg
        width={size}
        height={size}
        viewBox="-100 -100 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform hover:scale-105 transition-transform duration-500 ease-out shrink-0"
        id="zaneen-logo-svg"
      >
        <defs>
          {/* Main coppery-bronze gradient for the ribbon */}
          <linearGradient id="zaneen-ribbon-grad" x1="-50" y1="-80" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b67148" />
            <stop offset="35%" stopColor="#8d4b26" />
            <stop offset="70%" stopColor="#5d2c12" />
            <stop offset="100%" stopColor="#401a07" />
          </linearGradient>

          {/* Highlights to make the ribbon pop with 3D sheen */}
          <linearGradient id="zaneen-highlight-grad" x1="-30" y1="-90" x2="30" y2="-40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d49570" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#b67148" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5d2c12" stopOpacity="0" />
          </linearGradient>

          {/* Shadow gradient for the weave overlap effect */}
          <radialGradient id="zaneen-shadow" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dynamic drop shadow under the logo */}
        <ellipse cx="0" cy="85" rx="50" ry="10" fill="url(#zaneen-shadow)" opacity="0.35" />

        {/* 6-fold symmetry loop ribbon */}
        {[0, 60, 120, 180, 240, 300].map((angle, index) => {
          return (
            <g transform={`rotate(${angle})`} key={index} id={`zaneen-petal-${index}`}>
              {/* Petal base ribbon */}
              <path
                d="M 0,-14 
                   C -22,-20 -44,-42 -32,-70 
                   C -20,-98 20,-98 32,-70 
                   C 44,-42 22,-20 0,-14 Z"
                fill="url(#zaneen-ribbon-grad)"
              />

              {/* Overlapping edge shadow to create "over-under" depth */}
              <path
                d="M 0,-14 
                   C -22,-20 -44,-42 -32,-70
                   C -20,-98 20,-98 32,-70"
                stroke="#291104"
                strokeWidth="2"
                opacity="0.3"
                fill="none"
              />

              {/* 3D highlight curve */}
              <path
                d="M -22,-55 
                   C -15,-80 15,-80 22,-55"
                stroke="url(#zaneen-highlight-grad)"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.9"
                fill="none"
              />
              
              {/* Subtle inner accent ribbon */}
              <path
                d="M 0,-25 
                   C -12,-30 -24,-45 -18,-60 
                   C -12,-75 12,-75 18,-60 
                   C 24,-45 12,-30 0,-25 Z"
                fill="#401a07"
                opacity="0.15"
              />
            </g>
          );
        })}

        {/* Center negative space 6-pointed star crisp outline */}
        <polygon
          points="0,-12 10.39,-6 10.39,6 0,12 -10.39,6 -10.39,-6"
          fill="#FAF4ED"
          opacity="0.15"
        />
      </svg>

      {showText && (
        <span
          className={`font-sans font-black tracking-[0.25em] text-lg uppercase select-none ${isHorizontal ? "mt-0" : "mt-4"} ${textColorClass}`}
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
          id="zaneen-logo-text"
        >
          Zaneen
        </span>
      )}
    </div>
  );
}
