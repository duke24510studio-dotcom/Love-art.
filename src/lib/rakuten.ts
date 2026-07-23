// Rakuten Ichiba product lookup + affiliate link helpers.
// Docs: https://webservice.rakuten.co.jp/api/ichibaitemsearch/

const ITEM_SEARCH_ENDPOINT =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

export function getRakutenAppId(): string {
  const id = process.env.RAKUTEN_APP_ID;
  if (!id) {
    throw new Error(
      "RAKUTEN_APP_ID is not set. Get one at https://webservice.rakuten.co.jp/ and add it to your .env file."
    );
  }
  return id;
}

/** Parse {shopCode, itemCode} out of a Rakuten Ichiba product URL. */
export function parseRakutenItemUrl(rawUrl: string): { shopCode: string; itemCode: string } {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("有効なURLを入力してください");
  }
  if (!/(^|\.)rakuten\.co\.jp$/.test(url.hostname)) {
    throw new Error("楽天市場(item.rakuten.co.jp)の商品URLを入力してください");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("URLから店舗コード・商品コードを読み取れませんでした");
  }
  return { shopCode: parts[0], itemCode: parts[1] };
}

/**
 * Build a simple Rakuten affiliate redirect link (ハイブリッドリンク方式).
 * Requires the seller's own RAKUTEN_AFFILIATE_ID (from the Rakuten Affiliate
 * dashboard). Falls back to the plain item URL if not configured.
 */
export function buildAffiliateUrl(itemUrl: string): string {
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!affiliateId || !itemUrl) return itemUrl;
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(itemUrl)}&link_type=hybrid_url`;
}

export type RakutenItem = {
  itemUrl: string;
  itemCode: string;
  shopCode: string;
  shopName: string;
  name: string;
  price: number;
  imageUrl: string;
  catchcopy: string;
  itemCaption: string;
  genreName: string;
  reviewAverage: number;
  reviewCount: number;
  affiliateUrl: string;
};

type RakutenApiItem = {
  itemName?: string;
  itemPrice?: number;
  itemCaption?: string;
  catchcopy?: string;
  itemUrl?: string;
  itemCode?: string;
  shopName?: string;
  shopCode?: string;
  genreName?: string;
  reviewAverage?: number;
  reviewCount?: number;
  affiliateUrl?: string;
  mediumImageUrls?: { imageUrl: string }[];
};

/** Look up a Rakuten Ichiba product by its item page URL via the official API. */
export async function lookupRakutenItem(rawUrl: string): Promise<RakutenItem> {
  const { shopCode, itemCode } = parseRakutenItemUrl(rawUrl);
  const appId = getRakutenAppId();
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;

  const params = new URLSearchParams({
    applicationId: appId,
    itemCode: `${shopCode}:${itemCode}`,
    format: "json",
  });
  if (affiliateId) params.set("affiliateId", affiliateId);

  const res = await fetch(`${ITEM_SEARCH_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`楽天APIへのリクエストに失敗しました (${res.status})`);
  }
  const data = (await res.json()) as { Items?: { Item: RakutenApiItem }[]; error?: string; error_description?: string };
  if (data.error) {
    throw new Error(`楽天API: ${data.error_description || data.error}`);
  }
  const item = data.Items?.[0]?.Item;
  if (!item) {
    throw new Error("楽天市場でこの商品が見つかりませんでした（URLをご確認ください）");
  }

  const itemUrl = item.itemUrl?.trim() || rawUrl;
  const imageUrl = (item.mediumImageUrls?.[0]?.imageUrl || "").replace(/\?.*$/, "");

  return {
    itemUrl,
    itemCode: item.itemCode || `${shopCode}:${itemCode}`,
    shopCode: item.shopCode || shopCode,
    shopName: item.shopName || "",
    name: item.itemName || "",
    price: Number(item.itemPrice ?? 0),
    imageUrl,
    catchcopy: item.catchcopy || "",
    itemCaption: item.itemCaption || "",
    genreName: item.genreName || "",
    reviewAverage: Number(item.reviewAverage ?? 0),
    reviewCount: Number(item.reviewCount ?? 0),
    affiliateUrl: item.affiliateUrl || buildAffiliateUrl(itemUrl),
  };
}
