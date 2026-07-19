import { ImageResponse } from "next/og";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const alt = `${APP_NAME} — ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(145deg, #fafafa 0%, #d4d4d8 100%)",
              color: "#09090b",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -2,
              background: "linear-gradient(160deg, #222 0%, #111 100%)",
              color: "#fafafa",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            M
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
            {APP_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: -2.2,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {APP_TAGLINE}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "rgba(250,250,250,0.62)",
              maxWidth: 720,
              lineHeight: 1.35,
            }}
          >
            Premium AI deep research for teams who ship answers, not tabs.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
