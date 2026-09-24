const Logo = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="9" className="fill-indigo-600" />
    <path d="M10 12.5 13 9h6l3 3.5L16 23z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M10 12.5h12M13 9l3 14 3-14" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" opacity=".7" />
  </svg>
);

export default Logo;
