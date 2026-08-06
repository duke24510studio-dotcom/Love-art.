import Link from "next/link";
import type { Metadata } from "next";
import {
  SHOP_CONTACT_EMAIL,
  SHOP_DELIVERY_NOTE,
  SHOP_DELIVERY_NOTE_JA,
  SHOP_DISCLOSURE,
  SHOP_DISCLOSURE_JA,
  SHOP_LICENSE_SUMMARY,
  SHOP_NAME,
  SHOP_NAME_JA,
} from "@/lib/shop";
import { DeskIllustration, LeafDivider } from "@/components/shop/Illustrations";

export const metadata: Metadata = {
  title: `About — ${SHOP_NAME}`,
  description: "About the studio, how the products are made, and the licence they ship under.",
};

function Section({ title, titleJa, children }: { title: string; titleJa?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[10px] tracking-[0.3em] uppercase opacity-45">{title}</h2>
        {titleJa && <p className="text-base font-light mt-1.5">{titleJa}</p>}
      </div>
      <div className="text-sm opacity-70 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function ShopAboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-14">
      <header className="space-y-5">
        <p className="text-[10px] tracking-[0.35em] uppercase opacity-45">About</p>
        <h1 className="text-2xl font-light leading-snug">
          {SHOP_NAME}
          <span className="opacity-40 text-lg ml-3">{SHOP_NAME_JA}</span>
        </h1>
        <DeskIllustration className="w-full max-w-xs" />
      </header>

      <Section title="The studio" titleJa="このスタジオについて">
        <p>
          {SHOP_NAME} is a small independent studio making digital goods for quiet workspaces:
          Notion templates, original art prints, and simple line illustration.
        </p>
        <p>
          余白（yohaku）means the empty space left in a composition — the part that is deliberately
          not filled. That idea runs through everything here. The templates hide more than they
          show, and the prints leave the paper visible.
        </p>
      </Section>

      <Section title="How things are made" titleJa="制作について">
        <p>
          Every product is an original work. Nothing here reproduces an existing print, an existing
          template, or another studio&apos;s design.
        </p>
        <p>{SHOP_DISCLOSURE}</p>
        <p className="text-xs opacity-80">{SHOP_DISCLOSURE_JA}</p>
      </Section>

      <Section title="Delivery" titleJa="お届けについて">
        <p>{SHOP_DELIVERY_NOTE}</p>
        <p className="text-xs opacity-80">{SHOP_DELIVERY_NOTE_JA}</p>
        <p>
          Checkout and file delivery are handled by an external provider. Payment details are never
          entered on this site.
        </p>
      </Section>

      <section className="space-y-3" id="licence">
        <div>
          <h2 className="text-[10px] tracking-[0.3em] uppercase opacity-45">Licence</h2>
          <p className="text-base font-light mt-1.5">ライセンス</p>
        </div>
        <ul className="space-y-2 text-sm opacity-70">
          {SHOP_LICENSE_SUMMARY.map((line, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span style={{ color: "#7a9e7e" }}>—</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {SHOP_CONTACT_EMAIL && (
        <Section title="Contact" titleJa="お問い合わせ">
          <p>
            <a
              href={`mailto:${SHOP_CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:opacity-60 transition-opacity"
              style={{ color: "#2d5a3d" }}
            >
              {SHOP_CONTACT_EMAIL}
            </a>
          </p>
        </Section>
      )}

      <div className="pt-4">
        <LeafDivider className="w-28 mb-8" />
        <div className="flex flex-wrap gap-4 text-xs tracking-widest uppercase">
          <Link
            href="/shop"
            className="px-5 py-3 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#2d5a3d", color: "#f5f0e8" }}
          >
            Browse products
          </Link>
          <Link
            href="/blog"
            className="px-5 py-3 border transition-opacity hover:opacity-60"
            style={{ borderColor: "#d8d0c0" }}
          >
            Read the journal
          </Link>
        </div>
      </div>
    </div>
  );
}
