import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** MicroManus favicon — bold M monogram. */
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
          background: "#0a0a0a",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.14)",
            background:
              "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 55%, #050505 100%)",
            color: "#fafafa",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.08em",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size },
  );
}
