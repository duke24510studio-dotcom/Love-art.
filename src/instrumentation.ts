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
    const { seedFeedsIfEmpty } = await import("@/lib/seed-feeds");
    await seedFeedsIfEmpty();
  } catch (err) {
    console.error("[seed] startup feed seed failed:", err);
  }
}
