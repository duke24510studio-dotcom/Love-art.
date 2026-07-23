import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Japan Supplier Intelligence — Curated Japanese Supplier Data & Market Services",
  description:
    "Kyoto-based Japan Supplier Intelligence: curated, AI-ready databases of Japanese suppliers (matcha, sake, knives, ceramics, cosmetics OEM), AI visibility audits, and on-the-ground verification for overseas companies.",
};

const CREAM = "#f5f0e8";
const GREEN = "#2d5a3d";
const PARCHMENT = "#ede8dc";
const BORDER = "#d8d0c0";

const INDUSTRIES = [
  {
    ja: "抹茶",
    name: "Matcha & Japanese Tea",
    desc: "Uji and regional producers, ceremonial to culinary grade, organic options, OEM & private-label capability.",
    tag: "Flagship",
  },
  {
    ja: "酒",
    name: "Sake Breweries",
    desc: "Export-experienced breweries including Kyoto / Fushimi, premium and craft labels, gift and restaurant channels.",
    tag: "High demand",
  },
  {
    ja: "刃",
    name: "Kitchen Knives & Blades",
    desc: "Sakai-tradition makers and workshops trusted by professional chefs, with export track records worldwide.",
    tag: "High demand",
  },
  {
    ja: "器",
    name: "Kyoto Ceramics & Tableware",
    desc: "Kyo-yaki studios and wholesalers offering small-lot OEM for hotels, restaurants, and lifestyle brands.",
    tag: "Small-lot OEM",
  },
  {
    ja: "美",
    name: "Cosmetics OEM (J-Beauty)",
    desc: "Manufacturers strong in natural and functional ingredients, EU/US-compliant facilities, private-brand development.",
    tag: "OEM",
  },
  {
    ja: "工",
    name: "Traditional Crafts & Textiles",
    desc: "Premium lifestyle craft makers — textiles, woodwork, paper — open to overseas collaboration.",
    tag: "Expanding",
  },
];

const DATA_FIELDS = [
  "Company name (Japanese + English)",
  "Location & region",
  "Industry / sub-category",
  "Plain-English company summary",
  "OEM feasibility & notes",
  "English support level",
  "Export track record (USA / EU / Asia)",
  "MOQ indicators",
  "Overseas sales strengths",
  "Exhibition history",
  "Website & SNS links",
  "Recommended use cases for buyers",
  "Last-verified date & source notes",
];

const SERVICES = [
  {
    step: "01",
    name: "Supplier Intelligence Database",
    price: "from $49",
    desc: "Curated, AI-ready databases of Japanese suppliers in high-demand niches. Delivered as a Notion workspace plus CSV — filter, shortlist, and contact partners immediately. Not a scraped list: every entry is researched from Japanese-language primary sources and summarized in clear English.",
    points: [
      "Notion share link + CSV delivery",
      "English summaries written for overseas buyers",
      "OEM feasibility, MOQ, and export indicators",
      "Quarterly updates on core industries",
    ],
  },
  {
    step: "02",
    name: "AI Visibility Audit (Japan)",
    price: "custom quote",
    desc: "How does your brand appear when Japanese customers and partners ask AI assistants and search engines about your category? We audit your visibility across AI answers and Japanese-language search, then deliver a prioritized action report in English.",
    points: [
      "AI answer & Japanese search visibility check",
      "Competitor comparison in your category",
      "Structured English report (PDF)",
      "Concrete fixes: content, listings, wording",
    ],
  },
  {
    step: "03",
    name: "On-the-Ground Verification",
    price: "custom quote",
    desc: "Before you commit to a Japanese supplier, we verify on the ground. Kyoto-based, we confirm business status through official sources and — where arranged — conduct visits with photo and video reporting, so you can proceed with confidence.",
    points: [
      "Official-source business verification",
      "Reputation & negative-media screening",
      "Photo / video visit reports (by arrangement)",
      "Bilingual liaison for first contact",
    ],
  },
];

const PACKAGES = [
  {
    name: "Basic",
    price: "$49",
    desc: "Matcha & Japanese Tea — 50 curated producers",
    items: ["Structured CSV + Notion access", "English summaries", "OEM & export indicators"],
    featured: false,
  },
  {
    name: "Standard",
    price: "$149",
    desc: "Two industries — 150 suppliers total",
    items: [
      "Everything in Basic",
      "Choose 2 industries (e.g. Matcha + Sake)",
      "Recommended use cases per supplier",
    ],
    featured: true,
  },
  {
    name: "Premium",
    price: "$299",
    desc: "Cross-industry — 300 suppliers",
    items: [
      "Everything in Standard",
      "All available industries",
      "Custom filters on request",
      "1 month of update support",
    ],
    featured: false,
  },
];

const FAQ = [
  {
    q: "Is this scraped public data?",
    a: "No. Entries are curated from Japanese-language primary sources (government registries, company sites, trade publications) and enriched with original English summaries, OEM notes, and buyer-oriented insights. The value is the curation, translation, and structure — not raw scraping.",
  },
  {
    q: "How is the data kept up to date?",
    a: "Core industries are re-verified quarterly, and every record carries a last-verified date with source notes so you always know how fresh it is.",
  },
  {
    q: "Can I request a custom industry or region?",
    a: "Yes. Custom industry research is available as a Premium add-on or a separate quote. Tell us your target category and use case and we will confirm feasibility first.",
  },
  {
    q: "Do you make introductions to suppliers?",
    a: "Introduction and bilingual first-contact support is available as an optional add-on. Many Japanese SMEs respond far better to a properly written Japanese introduction.",
  },
  {
    q: "What formats do you deliver in?",
    a: "A shared Notion database (filterable views included) plus CSV export. PDF summary reports are available for audit and verification services.",
  },
  {
    q: "Who is this for?",
    a: "Food & beverage brands, beauty brands seeking Japanese OEM, importers and distributors, hotel and restaurant groups, and product developers looking for authentic Japanese suppliers.",
  },
];

export default function SupplierIntelligencePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-8 pb-12 text-center" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-xs tracking-[0.5em] uppercase opacity-50 mb-4">Kyoto, Japan</p>
        <h1 className="text-4xl md:text-5xl font-light tracking-widest mb-4" style={{ color: GREEN }}>
          Japan Supplier Intelligence
        </h1>
        <p className="text-sm tracking-[0.3em] uppercase opacity-60 mb-6">
          Curated Japanese supplier data · AI visibility audits · On-the-ground verification
        </p>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed opacity-80">
          Finding reliable Japanese suppliers is hard from overseas: information is scattered,
          Japanese-only, and months out of date. We turn Japanese-language primary sources into
          structured, AI-ready intelligence in clear English — so you can shortlist, verify, and
          contact the right partners with confidence.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#packages"
            className="px-6 py-3 text-xs tracking-[0.3em] uppercase hover:opacity-80 transition-opacity"
            style={{ backgroundColor: GREEN, color: CREAM }}
          >
            View Packages
          </a>
          <a
            href="#contact"
            className="px-6 py-3 text-xs tracking-[0.3em] uppercase border hover:opacity-70 transition-opacity"
            style={{ borderColor: GREEN, color: GREEN }}
          >
            Get in Touch
          </a>
        </div>
      </section>

      {/* Three services */}
      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-2">What We Do</h2>
        <p className="text-2xl font-light tracking-wide mb-8" style={{ color: GREEN }}>
          Three services. One goal: confident sourcing from Japan.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div
              key={s.step}
              className="border p-6 flex flex-col"
              style={{ backgroundColor: PARCHMENT, borderColor: BORDER }}
            >
              <div className="text-xs tracking-[0.4em] opacity-40 mb-3">{s.step}</div>
              <h3 className="text-lg font-light tracking-wide mb-1" style={{ color: GREEN }}>
                {s.name}
              </h3>
              <div className="text-xs tracking-widest uppercase opacity-50 mb-4">{s.price}</div>
              <p className="text-sm leading-relaxed opacity-80 mb-4">{s.desc}</p>
              <ul className="mt-auto space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="text-xs tracking-wide flex gap-2">
                    <span style={{ color: GREEN }}>◯</span>
                    <span className="opacity-70">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-2">Industry Coverage</h2>
        <p className="text-2xl font-light tracking-wide mb-8" style={{ color: GREEN }}>
          High-demand niches, deeply curated
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRIES.map((ind) => (
            <div key={ind.name} className="border p-5" style={{ borderColor: BORDER }}>
              <div className="flex items-start justify-between mb-3">
                <span
                  className="min-w-10 h-10 px-2 flex items-center justify-center text-lg font-light"
                  style={{ backgroundColor: GREEN, color: CREAM }}
                >
                  {ind.ja}
                </span>
                <span
                  className="text-[10px] tracking-widest uppercase px-2 py-1"
                  style={{ backgroundColor: PARCHMENT, color: GREEN }}
                >
                  {ind.tag}
                </span>
              </div>
              <h3 className="text-sm tracking-wide font-medium mb-2" style={{ color: GREEN }}>
                {ind.name}
              </h3>
              <p className="text-xs leading-relaxed opacity-70">{ind.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's in the data */}
      <section className="border p-8" style={{ backgroundColor: PARCHMENT, borderColor: BORDER }}>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-2">Inside Every Record</h2>
        <p className="text-2xl font-light tracking-wide mb-6" style={{ color: GREEN }}>
          Structured for humans — and for your AI tools
        </p>
        <p className="text-sm leading-relaxed opacity-80 mb-6 max-w-3xl">
          Every supplier record follows the same schema, so you can filter in Notion, import the CSV
          into your CRM, or feed it to an AI assistant and ask questions like{" "}
          <em>&ldquo;which organic matcha producers support small-lot OEM for the EU?&rdquo;</em>
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
          {DATA_FIELDS.map((f) => (
            <div key={f} className="text-xs tracking-wide flex gap-2 py-1">
              <span style={{ color: GREEN }}>—</span>
              <span className="opacity-75">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="packages">
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-2">Packages</h2>
        <p className="text-2xl font-light tracking-wide mb-8" style={{ color: GREEN }}>
          Start small, scale as you source
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className="border p-6 flex flex-col"
              style={{
                borderColor: p.featured ? GREEN : BORDER,
                backgroundColor: p.featured ? PARCHMENT : "transparent",
                borderWidth: p.featured ? 2 : 1,
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm tracking-[0.3em] uppercase" style={{ color: GREEN }}>
                  {p.name}
                </h3>
                <span className="text-2xl font-light" style={{ color: GREEN }}>
                  {p.price}
                </span>
              </div>
              <p className="text-xs opacity-60 tracking-wide mb-5">{p.desc}</p>
              <ul className="space-y-2 mb-6">
                {p.items.map((item) => (
                  <li key={item} className="text-xs tracking-wide flex gap-2">
                    <span style={{ color: GREEN }}>◯</span>
                    <span className="opacity-70">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="mt-auto text-center px-4 py-2 text-xs tracking-[0.3em] uppercase hover:opacity-80 transition-opacity"
                style={
                  p.featured
                    ? { backgroundColor: GREEN, color: CREAM }
                    : { border: `1px solid ${GREEN}`, color: GREEN }
                }
              >
                Order via Fiverr
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs opacity-50 mt-4 tracking-wide">
          AI Visibility Audits and On-the-Ground Verification are quoted individually — message us
          with your target category and goals.
        </p>
      </section>

      {/* Why us */}
      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-2">Why Work With Us</h2>
        <p className="text-2xl font-light tracking-wide mb-8" style={{ color: GREEN }}>
          Kyoto-based, bilingual, AI-native
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              t: "We are on the ground",
              d: "Based in Kyoto — the heart of matcha, sake, and traditional craft country. When a record needs verifying, we can pick up the phone in Japanese or visit in person.",
            },
            {
              t: "Real industry experience",
              d: "We operate our own matcha-related business and network, so supplier notes reflect how these industries actually work — not guesses from a search engine.",
            },
            {
              t: "Built for the AI era",
              d: "Every deliverable is structured data first: consistent schemas, clean English, machine-readable formats your team and your AI tools can query directly.",
            },
            {
              t: "The gap we fill",
              d: "Enterprise Japanese databases cost thousands per year; free public data is fragmented and Japanese-only. We sit in between: affordable, specialized, and ready to use today.",
            },
          ].map((w) => (
            <div key={w.t} className="border p-6" style={{ borderColor: BORDER }}>
              <h3 className="text-sm tracking-wide font-medium mb-2" style={{ color: GREEN }}>
                {w.t}
              </h3>
              <p className="text-xs leading-relaxed opacity-70">{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-2">FAQ</h2>
        <p className="text-2xl font-light tracking-wide mb-8" style={{ color: GREEN }}>
          Common questions
        </p>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="border p-5 group" style={{ borderColor: BORDER }}>
              <summary
                className="text-sm tracking-wide cursor-pointer list-none flex justify-between items-center"
                style={{ color: GREEN }}
              >
                {f.q}
                <span className="opacity-40 group-open:rotate-45 transition-transform">＋</span>
              </summary>
              <p className="text-xs leading-relaxed opacity-70 mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Fair use */}
      <section className="border p-6" style={{ borderColor: BORDER }}>
        <h2 className="text-xs tracking-[0.4em] uppercase opacity-50 mb-3">Fair Use</h2>
        <p className="text-xs leading-relaxed opacity-70 max-w-3xl">
          Databases are built from publicly available information plus original curation and
          insight, and are licensed for your internal sourcing and research use. They may not be
          resold, redistributed, or used for mass unsolicited outreach. We never share private or
          confidential company information.
        </p>
      </section>

      {/* Contact / CTA */}
      <section
        id="contact"
        className="text-center py-12 px-6"
        style={{ backgroundColor: GREEN, color: CREAM }}
      >
        <p className="text-xs tracking-[0.5em] uppercase opacity-70 mb-4">Start Sourcing</p>
        <h2 className="text-3xl font-light tracking-widest mb-4">Tell us what you are looking for</h2>
        <p className="text-sm leading-relaxed opacity-80 max-w-xl mx-auto mb-8">
          Message us with your target industry and use case — we will confirm availability and
          recommend the right package, usually within 24 hours (JST).
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://www.fiverr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 text-xs tracking-[0.3em] uppercase hover:opacity-80 transition-opacity"
            style={{ backgroundColor: CREAM, color: GREEN }}
          >
            Order on Fiverr
          </a>
          <a
            href="mailto:duke24510studio@gmail.com"
            className="px-6 py-3 text-xs tracking-[0.3em] uppercase border hover:opacity-70 transition-opacity"
            style={{ borderColor: CREAM, color: CREAM }}
          >
            Email Us
          </a>
        </div>
        <p className="text-[10px] tracking-widest uppercase opacity-50 mt-8">
          Kyoto, Japan · English / 日本語
        </p>
      </section>
    </div>
  );
}
