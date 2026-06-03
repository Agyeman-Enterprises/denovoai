/**
 * AE Design Studio logo system.
 *
 * Variants:
 *  navbar   — coral Æ icon + "Design Studio" (no "AE" prefix in text)
 *  primary  — coral Æ icon + "AE Design Studio" (full lockup)
 *  tagline  — primary + "Design. Build. Launch." below
 *  mark     — icon only (favicon / small spaces)
 */
import Link from "next/link";

const coral = "#F5530A";

interface LogoProps {
  variant?: "navbar" | "primary" | "tagline";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const ICON_SIZE = { sm: 28, md: 36, lg: 52 };
const RADIUS   = { sm: 8,  md: 10, lg: 14 };
const TEXT_SIZE = { sm: 14, md: 17, lg: 24 };
const GAP       = { sm: 10, md: 13, lg: 18 };

export function Logo({ variant = "navbar", size = "sm", href = "/" }: LogoProps) {
  const iconSz   = ICON_SIZE[size];
  const radius   = RADIUS[size];
  const textSz   = TEXT_SIZE[size];
  const gap      = GAP[size];
  const aeSz     = Math.round(textSz * 0.94);
  const lfontSz  = Math.round(iconSz * 0.54);

  return (
    <Link href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap }}>
      {/* Æ icon */}
      <div style={{
        width: iconSz, height: iconSz, borderRadius: radius, flexShrink: 0,
        background: "linear-gradient(145deg, #F97316 0%, #EA4C0B 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 10px rgba(245,83,10,0.3)",
      }}>
        <span style={{
          fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 700,
          fontSize: lfontSz, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em",
        }}>Æ</span>
      </div>

      {/* Wordmark */}
      <div>
        {variant === "navbar" ? (
          /* Navbar: just "Design Studio" */
          <span style={{
            fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 400,
            fontSize: textSz, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1,
          }}>Design Studio</span>
        ) : (
          /* Primary / tagline: "AE Design Studio" */
          <div style={{ lineHeight: 1.1 }}>
            <span style={{
              fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 700,
              fontSize: aeSz, color: coral, letterSpacing: "-0.03em",
            }}>AE </span>
            <span style={{
              fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 400,
              fontSize: aeSz, color: "#fff", letterSpacing: "-0.02em",
            }}>Design Studio</span>
          </div>
        )}

        {variant === "tagline" && (
          <p style={{
            fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", margin: "5px 0 0",
            fontFamily: "var(--font-geist-sans)", fontStyle: "normal", fontWeight: 500,
          }}>
            Design · Build · Launch
          </p>
        )}
      </div>
    </Link>
  );
}

/* Icon-only — favicon, app icons, small spaces */
export function LogoMark({ size = 28 }: { size?: number }) {
  const radius = Math.round(size * 0.28);
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: "linear-gradient(145deg, #F97316 0%, #EA4C0B 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px rgba(245,83,10,0.3)",
    }}>
      <span style={{
        fontFamily: "var(--font-playfair)", fontStyle: "italic", fontWeight: 700,
        fontSize: Math.round(size * 0.54), color: "#fff", lineHeight: 1, letterSpacing: "-0.03em",
      }}>Æ</span>
    </div>
  );
}
