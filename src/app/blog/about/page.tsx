import { BLOG_DISCLOSURE_JA, BLOG_SITE_NAME } from "@/lib/blog";

// NOTE for the site operator: replace the bracketed placeholder below with
// your real contact details before submitting this site for affiliate
// program review.
const CONTACT_PLACEHOLDER = "（ここにご自身の連絡先メールアドレスを記載してください）";

export default function BlogAboutPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.3em] uppercase opacity-50 mb-1">About</p>
        <h1 className="text-xl font-light tracking-wide" style={{ color: "#2d5a3d" }}>
          このサイトについて
        </h1>
      </div>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium" style={{ color: "#2d5a3d" }}>
          運営方針
        </h2>
        <p>
          「{BLOG_SITE_NAME}」は、お茶・食品ギフトを中心に、贈り物選びや暮らしの中でのお茶の楽しみ方を
          紹介する個人運営のブログです。特定の店舗・ブランドを装う口コミではなく、一般的な選び方の
          考え方をまとめた読み物としてお読みください。
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium" style={{ color: "#2d5a3d" }}>
          AI利用について
        </h2>
        <p>{BLOG_DISCLOSURE_JA}</p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium" style={{ color: "#2d5a3d" }}>
          広告・アフィリエイトについて
        </h2>
        <p>
          本サイトは将来的にアフィリエイトプログラム（楽天アフィリエイト等）に参加する場合があります。
          該当する記事には、その旨を明記します。
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium" style={{ color: "#2d5a3d" }}>
          プライバシーについて
        </h2>
        <p>
          本サイトはアクセス解析のためにCookie等を使用する場合があります。お問い合わせいただいた内容は
          回答の目的以外には使用しません。
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-medium" style={{ color: "#2d5a3d" }}>
          お問い合わせ
        </h2>
        <p>{CONTACT_PLACEHOLDER}</p>
      </section>
    </div>
  );
}
