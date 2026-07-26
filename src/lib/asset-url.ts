// Stored asset paths look like "outputs/images/x.png" or "./outputs/images/x.png"
// (see src/lib/image-store.ts — they are blob-store keys, not real files).
// next.config.ts rewrites /outputs/images/:file* to the route that serves them,
// so the browser URL is the part of the key from "outputs/images/" onwards.
export function assetUrl(storedPath: string): string {
  if (!storedPath) return "";
  const marker = "outputs/images/";
  const at = storedPath.indexOf(marker);
  const rest = at >= 0 ? storedPath.slice(at + marker.length) : storedPath.split("/").pop() ?? "";
  return `/outputs/images/${rest}`;
}
