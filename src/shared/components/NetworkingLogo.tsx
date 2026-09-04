/**
 * The course mark: a small network — a central hub node linked out to three
 * peers, the universal "nodes and links" motif for computer networking. The
 * hub is networking blue (#2563EB); the peers are the cyan accent (#06B6D4)
 * riding the same links. Callers control size via `className`; the brand
 * colours are fixed so the mark looks consistent in both light and dark themes.
 */
export function NetworkingLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
    >
      {/* links from the hub out to each peer node */}
      <path
        d="M12 12 5 5.5M12 12l7-6.5M12 12v7.5"
        stroke="#2563EB"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* peer nodes */}
      <circle cx="5" cy="5.5" r="2.1" fill="#06B6D4" />
      <circle cx="19" cy="5.5" r="2.1" fill="#06B6D4" />
      <circle cx="12" cy="19.5" r="2.1" fill="#06B6D4" />
      {/* hub node */}
      <circle cx="12" cy="12" r="2.7" fill="#2563EB" />
    </svg>
  );
}
