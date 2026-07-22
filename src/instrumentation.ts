export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) return;

  try {
    const { seedThemesIfEmpty } = await import("@/lib/seed-themes");
    await seedThemesIfEmpty();
  } catch (err) {
    console.error("[seed] startup seed failed:", err);
  }

  try {
    const { ensureSeedFeeds } = await import("@/lib/seed-feeds");
    await ensureSeedFeeds();
  } catch (err) {
    console.error("[seed] startup feed seed failed:", err);
  }

  try {
    const { ensureHokusaiThemes } = await import("@/lib/hokusai");
    await ensureHokusaiThemes();
  } catch (err) {
    console.error("[seed] startup hokusai seed failed:", err);
  }
}
