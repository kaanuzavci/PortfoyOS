import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PortföyOS — Kişisel Yatırım Takibi",
    short_name: "PortföyOS",
    description:
      "İlk giriş maliyetlerine göre tüm yatırımların anlık kâr/zarar, reel getiri ve seri takibi.",
    start_url: "/",
    display: "standalone",
    background_color: "#15161a",
    theme_color: "#15161a",
    lang: "tr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
