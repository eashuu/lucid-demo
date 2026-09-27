export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="13" fill="none" stroke="var(--accent)" strokeWidth="3" />
        <circle cx="19.5" cy="12.5" r="4" fill="var(--accent)" />
      </svg>
      <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.8 }}>
        lucid
      </span>
    </span>
  );
}
