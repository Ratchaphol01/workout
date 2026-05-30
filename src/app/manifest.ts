import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WorkoutLog",
    short_name: "WorkoutLog",
    description: "บันทึกการออกกำลังกายรายวัน",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0ea5e9",
    orientation: "portrait",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
