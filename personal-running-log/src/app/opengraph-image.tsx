import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "RedRunner — personal training log";

/** Link-preview card when the URL is shared. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(145deg, #141418 0%, #222228 55%, #7f1d1d 100%)",
          color: "#ffffff",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.03em" }}>
            RedRunner
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Plan the week. Log the run.
          </div>
          <div style={{ fontSize: 28, color: "#d9d9de", maxWidth: 720 }}>
            Personal training log for mileage, workouts, and week goals.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
