import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Exact vector recreation of the official Alamala floral-ribbon "A" emblem.
 * Recreated with precision from the official brand card:
 * 5 outer petal lobes + central stylized "A" ribbon weave.
 */
export const AlamalaEmblem: React.FC<LogoProps> = ({
  className = '',
  size = 48,
  color = '#C3282E' // Official crimson red from card
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Logo Dapur Alamala"
    >
      {/* 1. Top Petal Apex */}
      <path
        d="M100 24C92 42 78 58 68 68C82 72 118 72 132 68C122 58 108 42 100 24Z"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Top-Left Petal Flare */}
      <path
        d="M68 68C52 64 36 74 38 90C40 102 54 110 68 104"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Top-Right Petal Flare */}
      <path
        d="M132 68C148 64 164 74 162 90C160 102 146 110 132 104"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Bottom-Left Petal Calyx */}
      <path
        d="M68 104C50 108 44 126 48 138C54 154 78 162 94 150C97 148 100 144 100 138"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 5. Bottom-Right Petal Calyx */}
      <path
        d="M132 104C150 108 156 126 152 138C146 154 122 162 106 150C103 148 100 144 100 138"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 6. Central Stylized 'A' Left Leg & Loop */}
      <path
        d="M100 38L78 102C74 116 86 130 100 120C114 110 114 86 100 86C86 86 86 110 100 120"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 7. Central Stylized 'A' Right Leg */}
      <path
        d="M100 38L122 102"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 8. Intertwining Ribbon Weaves */}
      <path
        d="M68 68C80 92 100 106 124 120"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M132 68C120 92 100 106 76 120"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Exact replica of the official physical card uploaded by the user:
 * Cream background, red rounded perimeter border, emblem, serif ALAMALA,
 * "Puding, Cake & Catering.", and contact handles.
 */
export const AlamalaOfficialBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative bg-[#F4F1DE] rounded-2xl p-6 sm:p-7 border-[5px] border-[#C3282E] shadow-md flex flex-col items-center text-center max-w-xs mx-auto ${className}`}>
      {/* Emblem */}
      <AlamalaEmblem size={96} color="#C3282E" className="mb-2 hover:scale-105 transition-transform" />

      {/* Wordmark ALAMALA */}
      <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.18em] text-[#1C1917] mt-1 mb-1">
        ALAMALA
      </h2>

      {/* Subtitle */}
      <p className="font-serif italic text-sm sm:text-base font-semibold text-[#292524] mb-3">
        Puding, Cake &amp; Catering.
      </p>

      {/* Social / WhatsApp Footer */}
      <div className="pt-3 border-t border-[#C3282E]/30 w-full flex items-center justify-center gap-3 text-xs font-semibold text-stone-800">
        <span className="flex items-center gap-1">
          <span className="text-[#C3282E]">📷</span>
          <span>alamala_malang</span>
        </span>
        <span className="text-stone-400">·</span>
        <span className="flex items-center gap-1">
          <span className="text-emerald-700">💬</span>
          <span className="font-mono">087875301729</span>
        </span>
      </div>
    </div>
  );
};
