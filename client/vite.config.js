import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Fills in deployment-specific values so nothing is hard-coded to one
 * person's domain:
 * - __SITE_URL__ in index.html (canonical, Open Graph, Twitter tags)
 * - robots.txt and sitemap.xml
 * - the Microsoft Clarity snippet, only when VITE_CLARITY_ID is set
 *
 * SITE_URL comes from VITE_SITE_URL, else Vercel's production domain
 * (VERCEL_PROJECT_PRODUCTION_URL is set automatically during Vercel builds).
 */
const siteConfig = (env) => {
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (
    env.VITE_SITE_URL ||
    (vercelHost ? `https://${vercelHost}` : "http://localhost:5173")
  ).replace(/\/+$/, "");
  const clarityId = (env.VITE_CLARITY_ID || "").trim();

  const claritySnippet = /^[a-z0-9]+$/i.test(clarityId)
    ? `<script>
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    </script>`
    : "";

  return {
    name: "site-config",
    transformIndexHtml(html) {
      return html
        .replaceAll("__SITE_URL__", siteUrl)
        .replace("<!-- CLARITY -->", claritySnippet);
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      });
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  return {
    plugins: [react(), tailwindcss(), siteConfig(env)],
  };
});
