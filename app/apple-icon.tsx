import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** MicroManus Apple touch icon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 140,
            height: 140,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(160deg, #222 0%, #111 50%, #09090b 100%)",
            color: "#fafafa",
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.08em",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            boxShadow: "0 20px 48px rgba(0,0,0,0.45)",
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
