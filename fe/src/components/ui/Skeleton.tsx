import React from "react";

type SkeletonProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Skeleton({
  width = "100%",
  height,
  borderRadius = "4px",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-300 ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      {...props}
    />
  );
}
