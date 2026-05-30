import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
          borderRadius: "40px",
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 6.5h11" />
          <path d="M6.5 17.5h11" />
          <path d="M3 9.5v5" />
          <path d="M21 9.5v5" />
          <path d="M3 12h18" />
          <circle cx="3" cy="9.5" r="1.5" fill="white" stroke="none" />
          <circle cx="3" cy="14.5" r="1.5" fill="white" stroke="none" />
          <circle cx="21" cy="9.5" r="1.5" fill="white" stroke="none" />
          <circle cx="21" cy="14.5" r="1.5" fill="white" stroke="none" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
