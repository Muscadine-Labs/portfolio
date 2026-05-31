import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portfolio",
    short_name: "Portfolio",
    description: "Personal finance dashboard for portfolio.muscadine.io",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#4c1d95",
    icons: [
      {
        src: "/muscadinelogo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/muscadinelogo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
