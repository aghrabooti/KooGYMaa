import Link from "next/link";

type BrandProps = {
  light?: boolean;
  compact?: boolean;
  className?: string;
};

export function Brand({ light = false, compact = false, className = "" }: BrandProps) {
  return (
    <Link
      aria-label="KooGYMaa home"
      className={`brand ${light ? "brand--light" : ""} ${className}`}
      href="/"
    >
      <span aria-hidden="true" className="brand__mark">
        <span />
        <span />
      </span>
      {!compact && (
        <span className="brand__wordmark">
          Koo<span>GYMaa</span>
        </span>
      )}
    </Link>
  );
}
