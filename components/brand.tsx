import Image from "next/image";
import Link from "next/link";
import mark from "@/public/brand/mark.png";
import wordmark from "@/public/brand/wordmark.png";
import lockup from "@/public/brand/lockup.png";

type BrandProps = {
  light?: boolean;
  compact?: boolean;
  stacked?: boolean;
  className?: string;
};

export function Brand({ light = false, compact = false, stacked = false, className = "" }: BrandProps) {
  return (
    <Link
      aria-label="صفحه نخست کوجیما"
      className={`brand ${light ? "brand--light" : ""} ${compact ? "brand--compact" : ""} ${className}`}
      dir="ltr"
      href="/"
    >
      {stacked ? (
        <Image alt="" className="brand__lockup" src={lockup} unoptimized />
      ) : (
        <>
          <Image alt="" className="brand__mark" src={mark} unoptimized />
          {!compact && <Image alt="" className="brand__wordmark" src={wordmark} unoptimized />}
        </>
      )}
    </Link>
  );
}
