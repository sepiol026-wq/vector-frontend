import type { CSSProperties } from "react";

type SkeletonBarProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
};

export function SkeletonBar({ width = "100%", height = 14, radius = 6, style }: SkeletonBarProps) {
  return (
    <span
      className="zskel"
      style={{ display: "block", width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({ size = 28, style }: { size?: number | string; style?: CSSProperties }) {
  return (
    <span
      className="zskel"
      style={{ display: "block", width: size, height: size, borderRadius: "50%", flex: "none", ...style }}
      aria-hidden="true"
    />
  );
}
