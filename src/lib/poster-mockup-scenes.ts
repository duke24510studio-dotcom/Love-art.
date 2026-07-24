// Fixed 11-scene set agreed with the user — frame/room pairing stays stable
// across posters so listing photos look like a consistent product line.
// Kept dependency-free (no fs/openai/prisma imports) so it's safe to import
// from client components as well as server-side lib code.
export const MOCKUP_SCENES = [
  {
    key: "living_room",
    label: "Living Room (black frame)",
    scenePrompt:
      "hung in a thin black metal frame on a warm neutral-toned living room wall, next to a modern sofa with linen cushions and a large monstera plant, soft warm afternoon sunlight, shallow depth of field with a slightly blurred coffee table and ceramic mug in the foreground",
  },
  {
    key: "bedroom",
    label: "Bedroom (oak frame)",
    scenePrompt:
      "in a natural light oak wood frame, hung above a bed with soft linen bedding in warm neutral tones, in a cozy minimalist bedroom, soft golden morning light filtering through sheer curtains, a small plant on a bedside table",
  },
  {
    key: "cafe",
    label: "Cafe (black frame)",
    scenePrompt:
      "in a thin black frame, hanging on an exposed brick and warm wood wall inside a cozy specialty coffee shop, a blurred espresso cup and pastry on a nearby table in the foreground, warm ambient pendant lighting",
  },
  {
    key: "office",
    label: "Office (walnut frame)",
    scenePrompt:
      "in a dark walnut wood frame, hanging on the wall above a minimalist wooden home-office desk with a laptop, a small potted plant, and a warm desk lamp, soft natural daylight from a side window",
  },
  {
    key: "washitsu",
    label: "Tatami Room (frameless washi mount)",
    scenePrompt:
      "displayed unframed, mounted on washi paper, in a traditional Japanese tatami room (washitsu) alcove (tokonoma-style), soft natural light through a shoji screen, minimal wabi-sabi styling",
  },
  {
    key: "window",
    label: "By the Window (white frame, easel)",
    scenePrompt:
      "in a slim white frame, displayed on a wooden easel beside a large window with sheer curtains, soft natural daylight streaming in, a small plant and books nearby",
  },
  {
    key: "desk",
    label: "Above Desk (gold frame)",
    scenePrompt:
      "in a thin brushed-gold frame, hung on the wall directly above a stylish home desk setup with a notebook, pen, and cup of tea, warm soft lighting",
  },
  {
    key: "entryway",
    label: "Entryway / Hallway (black frame)",
    scenePrompt:
      "in a thin black frame, hanging in a stylish entryway/hallway gallery wall above a console table with a small vase and a plant, soft warm ambient lighting",
  },
  {
    key: "reading_nook",
    label: "Reading Nook (light wood frame)",
    scenePrompt:
      "in a light natural wood frame, hanging above a cozy reading nook with a soft armchair, a warm floor lamp, and a side table with a book and cup of tea, warm inviting evening light",
  },
  {
    key: "kitchen",
    label: "Kitchen / Dining (white frame)",
    scenePrompt:
      "in a slim white frame, hanging in a bright minimalist kitchen/dining area above a wooden dining table with a simple ceramic vase, soft morning daylight",
  },
  {
    key: "staircase",
    label: "Staircase Wall (natural wood frame)",
    scenePrompt:
      "in a natural wood frame, hanging on a staircase gallery wall alongside a small potted plant, soft ambient daylight, elegant architectural framing",
  },
] as const;

export type MockupSceneKey = (typeof MOCKUP_SCENES)[number]["key"];

export function isMockupSceneKey(value: unknown): value is MockupSceneKey {
  return MOCKUP_SCENES.some((s) => s.key === value);
}
