import type { SVGProps } from 'react';

// Small stroke icons for chrome buttons. Colored coral (--brand) via .btn-icon,
// mirroring the search field's coral glyph. Decorative — aria-hidden; the button
// text carries the accessible name.
const base: SVGProps<SVGSVGElement> = {
  className: 'btn-icon',
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function ListIcon(): JSX.Element {
  return (
    <svg {...base}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function StarIcon(): JSX.Element {
  // Four-point sparkle: elongated points with concave rounded curves between
  // them (galaxy/twinkle), not a generic five-point star.
  return (
    <svg {...base}>
      <path d="M12 1.5C12 7 7 12 1.5 12C7 12 12 17 12 22.5C12 17 17 12 22.5 12C17 12 12 7 12 1.5Z" />
    </svg>
  );
}

export function RelatedLinesIcon(): JSX.Element {
  // Two dots connected by a dashed diagonal — represents inter-article links.
  return (
    <svg {...base}>
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="5" r="2.5" />
      <line x1="7" y1="17" x2="17" y2="7" strokeDasharray="3 2" />
    </svg>
  );
}

export function ResetIcon(): JSX.Element {
  return (
    <svg {...base}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

export function CubeIcon(): JSX.Element {
  // Wireframe box in 3/4 perspective — the 3D view mode (#31).
  return (
    <svg {...base}>
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
      <path d="M12 21.5V12" />
      <path d="M20.5 7 12 12 3.5 7" />
    </svg>
  );
}

export function OrbitIcon(): JSX.Element {
  // A body on a tilted orbital ring — the idle auto-orbit toggle (#31).
  return (
    <svg {...base}>
      <ellipse cx="12" cy="12" rx="9.5" ry="4" />
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="20" cy="9.4" r="1.4" />
    </svg>
  );
}
