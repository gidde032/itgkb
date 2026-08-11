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

export function ResetIcon(): JSX.Element {
  return (
    <svg {...base}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
