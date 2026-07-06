import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Matches header badge: rounded-lg bg-brand-600 + white FD */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#2563eb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 13,
          fontWeight: 900,
          borderRadius: 8,
          letterSpacing: "-0.5px",
        }}
      >
        FD
      </div>
    ),
    { ...size },
  );
}
