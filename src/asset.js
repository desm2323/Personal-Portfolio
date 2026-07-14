/* Prefixes public-folder paths with Vite's base URL so they resolve when the
   site is served from a subpath (GitHub Pages project site) — see the `base`
   option in vite.config.js. */
export const asset = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '');
