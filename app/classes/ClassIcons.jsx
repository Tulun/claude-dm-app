// D&D 5e Class Icons — SVG emblems inspired by official class symbols

const ClassIcons = {
  // Barbarian — crossed axes with rage marks
  barbarian: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Main axe head left */}
      <path d="M25 15 L15 45 Q12 52 18 55 L35 48 L42 30 Z" opacity="0.9"/>
      {/* Main axe head right */}
      <path d="M75 15 L85 45 Q88 52 82 55 L65 48 L58 30 Z" opacity="0.9"/>
      {/* Axe handles crossing */}
      <path d="M38 28 L55 85 Q50 90 50 90 L45 85 L32 32 Z" opacity="0.7"/>
      <path d="M62 28 L45 85 Q50 90 50 90 L55 85 L68 32 Z" opacity="0.7"/>
      {/* Central gem/rage point */}
      <circle cx="50" cy="35" r="6" opacity="1"/>
      {/* Rage lines */}
      <path d="M42 18 L46 10 L50 20 L54 10 L58 18" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),

  // Bard — lyre/harp
  bard: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Lyre frame */}
      <path d="M30 75 L30 40 Q30 15 50 12 Q70 15 70 40 L70 75" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      {/* Lyre curves at top */}
      <path d="M30 40 Q25 20 38 12" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <path d="M70 40 Q75 20 62 12" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      {/* Crossbar */}
      <rect x="28" y="70" width="44" height="6" rx="3"/>
      {/* Strings */}
      <line x1="40" y1="35" x2="40" y2="70" stroke={color} strokeWidth="2" opacity="0.5"/>
      <line x1="50" y1="30" x2="50" y2="70" stroke={color} strokeWidth="2" opacity="0.5"/>
      <line x1="60" y1="35" x2="60" y2="70" stroke={color} strokeWidth="2" opacity="0.5"/>
      {/* Base */}
      <path d="M35 76 Q50 90 65 76" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      {/* Musical notes */}
      <circle cx="22" cy="28" r="3" opacity="0.4"/>
      <line x1="25" y1="28" x2="25" y2="18" stroke={color} strokeWidth="1.5" opacity="0.4"/>
    </svg>
  ),

  // Cleric — radiant sun/holy symbol
  cleric: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Outer rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line key={i}
          x1={50 + 28 * Math.cos(angle * Math.PI / 180)}
          y1={50 + 28 * Math.sin(angle * Math.PI / 180)}
          x2={50 + 42 * Math.cos(angle * Math.PI / 180)}
          y2={50 + 42 * Math.sin(angle * Math.PI / 180)}
          stroke={color} strokeWidth={i % 2 === 0 ? "5" : "3"} strokeLinecap="round"
          opacity={i % 2 === 0 ? "0.9" : "0.5"}
        />
      ))}
      {/* Outer circle */}
      <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="3" opacity="0.8"/>
      {/* Inner circle */}
      <circle cx="50" cy="50" r="16" opacity="0.3"/>
      {/* Cross */}
      <rect x="46" y="35" width="8" height="30" rx="2"/>
      <rect x="38" y="43" width="24" height="8" rx="2"/>
    </svg>
  ),

  // Druid — leaf/paw with nature swirl
  druid: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Main leaf shape */}
      <path d="M50 8 Q80 25 78 55 Q75 80 50 92 Q25 80 22 55 Q20 25 50 8 Z" opacity="0.25"/>
      {/* Leaf veins */}
      <path d="M50 18 L50 80" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      <path d="M50 35 Q35 30 28 40" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 35 Q65 30 72 40" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 50 Q32 47 25 58" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 50 Q68 47 75 58" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 65 Q38 63 32 72" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 65 Q62 63 68 72" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      {/* Small curl at top */}
      <path d="M50 8 Q55 5 52 2" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),

  // Fighter — crossed swords with shield
  fighter: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Sword 1 - left to right */}
      <path d="M20 20 L70 70" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <path d="M15 15 L25 15 L25 25 L15 25 Z" opacity="0.6" transform="rotate(-45 20 20)"/>
      <path d="M67 63 L80 82 L75 85 L62 66 Z" opacity="0.8"/>
      {/* Sword 2 - right to left */}
      <path d="M80 20 L30 70" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      <path d="M75 15 L85 15 L85 25 L75 25 Z" opacity="0.6" transform="rotate(45 80 20)"/>
      <path d="M33 63 L20 82 L25 85 L38 66 Z" opacity="0.8"/>
      {/* Crossguards */}
      <path d="M32 32 L40 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
      <path d="M68 32 L60 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
      {/* Central shield shape */}
      <path d="M50 38 L62 45 L62 60 Q62 72 50 80 Q38 72 38 60 L38 45 Z" opacity="0.35"/>
      <path d="M50 42 L58 47 L58 58 Q58 68 50 74 Q42 68 42 58 L42 47 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.6"/>
    </svg>
  ),

  // Monk — open fist/hand
  monk: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <path d="M35 55 Q30 70 35 82 Q42 92 58 92 Q70 92 72 80 Q74 68 68 55 Z" opacity="0.4"/>
      {/* Fingers */}
      <path d="M38 55 Q36 35 40 20 Q42 14 46 20 L46 50" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.8"/>
      <path d="M46 48 L46 14 Q48 8 52 14 L52 48" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9"/>
      <path d="M54 48 L54 16 Q56 10 60 16 L60 50" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.85"/>
      <path d="M62 52 L62 24 Q64 18 68 24 L68 55" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.75"/>
      {/* Thumb */}
      <path d="M35 58 Q28 52 26 44 Q25 38 30 40 L36 50" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
      {/* Chi circle */}
      <circle cx="52" cy="72" r="8" fill="none" stroke={color} strokeWidth="2" opacity="0.4"/>
      <circle cx="52" cy="72" r="3" opacity="0.3"/>
    </svg>
  ),

  // Paladin — shield with wings
  paladin: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Left wing */}
      <path d="M38 40 Q20 30 8 15 Q12 35 22 45 Q10 35 5 25 Q12 48 28 52 Q15 48 8 40 Q18 58 35 55" opacity="0.5"/>
      {/* Right wing */}
      <path d="M62 40 Q80 30 92 15 Q88 35 78 45 Q90 35 95 25 Q88 48 72 52 Q85 48 92 40 Q82 58 65 55" opacity="0.5"/>
      {/* Shield body */}
      <path d="M50 22 L68 32 L68 55 Q68 75 50 88 Q32 75 32 55 L32 32 Z" opacity="0.35"/>
      <path d="M50 26 L64 34 L64 54 Q64 72 50 83 Q36 72 36 54 L36 34 Z" fill="none" stroke={color} strokeWidth="2.5" opacity="0.8"/>
      {/* Vertical line on shield */}
      <rect x="47" y="34" width="6" height="38" rx="2" opacity="0.6"/>
      {/* Horizontal line on shield */}
      <rect x="39" y="46" width="22" height="6" rx="2" opacity="0.6"/>
    </svg>
  ),

  // Ranger — bow and arrow
  ranger: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Bow */}
      <path d="M65 12 Q85 50 65 88" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      {/* Bow string */}
      <line x1="65" y1="12" x2="65" y2="88" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      {/* Bow tips */}
      <path d="M62 12 Q68 8 72 14" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      <path d="M62 88 Q68 92 72 86" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
      {/* Arrow shaft */}
      <line x1="15" y1="50" x2="62" y2="50" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      {/* Arrowhead */}
      <path d="M10 50 L22 44 L22 56 Z" opacity="0.9"/>
      {/* Arrow fletching */}
      <path d="M58 50 L65 43 L63 50 L65 57 Z" opacity="0.5"/>
      {/* Target circle hint */}
      <circle cx="28" cy="50" r="12" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2"/>
      <circle cx="28" cy="50" r="6" fill="none" stroke={color} strokeWidth="1.5" opacity="0.2"/>
    </svg>
  ),

  // Rogue — crossed daggers
  rogue: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Dagger 1 blade */}
      <path d="M28 18 L48 52 L44 56 L22 24 Z" opacity="0.8"/>
      {/* Dagger 1 guard */}
      <rect x="22" y="52" width="28" height="5" rx="2" transform="rotate(-30 36 54)" opacity="0.6"/>
      {/* Dagger 1 handle */}
      <path d="M40 60 L48 76" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <circle cx="50" cy="80" r="4" opacity="0.4"/>
      {/* Dagger 2 blade */}
      <path d="M72 18 L52 52 L56 56 L78 24 Z" opacity="0.8"/>
      {/* Dagger 2 guard */}
      <rect x="50" y="52" width="28" height="5" rx="2" transform="rotate(30 64 54)" opacity="0.6"/>
      {/* Dagger 2 handle */}
      <path d="M60 60 L52 76" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <circle cx="50" cy="80" r="4" opacity="0.4"/>
      {/* Shadow/stealth element */}
      <path d="M42 30 Q50 25 58 30" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3"/>
    </svg>
  ),

  // Sorcerer — flame/arcane energy
  sorcerer: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Outer flame */}
      <path d="M50 5 Q68 25 70 42 Q72 55 62 62 Q68 50 60 38 Q58 52 50 58 Q55 45 48 35 Q42 52 42 58 Q40 50 38 38 Q32 50 38 62 Q28 55 28 42 Q30 25 50 5 Z" opacity="0.5"/>
      {/* Inner flame */}
      <path d="M50 20 Q60 35 58 48 Q56 55 50 58 Q53 48 48 40 Q44 50 44 58 Q42 52 42 48 Q40 35 50 20 Z" opacity="0.8"/>
      {/* Core */}
      <ellipse cx="50" cy="55" rx="8" ry="6" opacity="0.4"/>
      {/* Drop/tear at center */}
      <path d="M50 42 Q55 50 50 56 Q45 50 50 42 Z" opacity="0.9"/>
      {/* Base swirl */}
      <path d="M32 68 Q38 62 50 65 Q62 62 68 68 Q62 78 50 82 Q38 78 32 68 Z" opacity="0.3"/>
      {/* Arcane sparks */}
      <circle cx="35" cy="30" r="2" opacity="0.3"/>
      <circle cx="65" cy="28" r="2" opacity="0.3"/>
      <circle cx="30" cy="55" r="1.5" opacity="0.2"/>
      <circle cx="70" cy="52" r="1.5" opacity="0.2"/>
    </svg>
  ),

  // Warlock — eldritch eye
  warlock: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Outer eye shape */}
      <path d="M10 50 Q30 20 50 18 Q70 20 90 50 Q70 80 50 82 Q30 80 10 50 Z" fill="none" stroke={color} strokeWidth="3" opacity="0.6"/>
      {/* Inner eye shape */}
      <path d="M20 50 Q35 30 50 28 Q65 30 80 50 Q65 70 50 72 Q35 70 20 50 Z" opacity="0.2"/>
      {/* Iris */}
      <circle cx="50" cy="50" r="16" fill="none" stroke={color} strokeWidth="3" opacity="0.7"/>
      <circle cx="50" cy="50" r="16" opacity="0.15"/>
      {/* Pupil */}
      <ellipse cx="50" cy="50" rx="7" ry="14" opacity="0.8"/>
      {/* Highlight */}
      <circle cx="45" cy="44" r="3" opacity="0.3"/>
      {/* Eldritch tentacle hints */}
      <path d="M8 50 Q4 42 8 35" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M92 50 Q96 42 92 35" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M8 50 Q4 58 8 65" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M92 50 Q96 58 92 65" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),

  // Wizard — hat/staff with star
  wizard: ({ size = 48, color = 'currentColor' }) => (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={color} xmlns="http://www.w3.org/2000/svg">
      {/* Hat */}
      <path d="M50 5 L72 65 L28 65 Z" opacity="0.35"/>
      <path d="M50 5 L72 65 L28 65 Z" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7"/>
      {/* Hat brim */}
      <ellipse cx="50" cy="65" rx="35" ry="10" opacity="0.4"/>
      <ellipse cx="50" cy="65" rx="35" ry="10" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7"/>
      {/* Hat band */}
      <path d="M32 58 Q50 52 68 58" fill="none" stroke={color} strokeWidth="3" opacity="0.5"/>
      {/* Star on hat */}
      <path d="M50 22 L52 28 L58 28 L53 32 L55 38 L50 34 L45 38 L47 32 L42 28 L48 28 Z" opacity="0.9"/>
      {/* Staff */}
      <line x1="75" y1="30" x2="85" y2="92" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.5"/>
      {/* Staff orb */}
      <circle cx="74" cy="28" r="6" opacity="0.6"/>
      <circle cx="73" cy="26" r="2" opacity="0.3"/>
      {/* Magic sparkles */}
      <circle cx="68" cy="20" r="1.5" opacity="0.3"/>
      <circle cx="80" cy="22" r="1" opacity="0.25"/>
    </svg>
  ),
};

export default ClassIcons;
