import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Tab favicon — solid brand red with a bold R. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#dc2626",
          borderRadius: 8,
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        R
      </div>
    ),
    { ...size }
  );
}
