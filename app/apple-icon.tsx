import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same FD badge, larger */
export default function AppleIcon() {
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
          fontSize: 72,
          fontWeight: 900,
          borderRadius: 40,
          letterSpacing: "-2px",
        }}
      >
        FD
      </div>
    ),
    { ...size },
  );
}
