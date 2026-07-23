import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRapidlyGrowingChannels } from "@/lib/channel-research";

const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

async function videosCsv(): Promise<string> {
  const since = new Date(Date.now() - 4 * 86_400_000);
  const snapshots = await prisma.ytVideoSnapshot.findMany({
    where: { fetchedAt: { gte: since } },
    orderBy: [{ videoId: "asc" }, { fetchedAt: "desc" }],
    distinct: ["videoId"],
  });
  snapshots.sort((a, b) => b.vph - a.vph);

  const headers = [
    "title",
    "channelTitle",
    "regionCode",
    "viewCount",
    "vph",
    "likeCount",
    "commentCount",
    "publishedAt",
    "videoUrl",
    "channelUrl",
  ];
  const rows = snapshots.map((v) =>
    [
      escape(v.title),
      escape(v.channelTitle),
      escape(v.regionCode),
      escape(v.viewCount),
      escape(Math.round(v.vph)),
      escape(v.likeCount),
      escape(v.commentCount),
      escape(v.publishedAt?.toISOString() ?? ""),
      escape(`https://www.youtube.com/watch?v=${v.videoId}`),
      escape(`https://www.youtube.com/channel/${v.channelId}`),
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

async function channelsCsv(): Promise<string> {
  const growth = await getRapidlyGrowingChannels(7, 100);
  const headers = [
    "title",
    "country",
    "subscriberNow",
    "subscriberGrowth",
    "subscriberGrowthPerDay",
    "viewGrowth",
    "channelUrl",
  ];
  const rows = growth.map((c) =>
    [
      escape(c.title),
      escape(c.country),
      escape(c.subscriberNow),
      escape(c.subscriberGrowth),
      escape(Math.round(c.subscriberGrowthPerDay)),
      escape(c.viewGrowth),
      escape(`https://www.youtube.com/channel/${c.channelId}`),
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

async function ideasCsv(): Promise<string> {
  const ideas = await prisma.channelIdea.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const headers = [
    "channelName",
    "concept",
    "targetAudience",
    "contentPillars",
    "sampleTitles",
    "postingCadence",
    "status",
    "sourceRegion",
  ];
  const rows = ideas.map((i) =>
    [
      escape(i.channelName),
      escape(i.concept),
      escape(i.targetAudience),
      escape(i.contentPillars),
      escape(i.sampleTitles),
      escape(i.postingCadence),
      escape(i.status),
      escape(i.sourceRegion),
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  const tab = new URL(req.url).searchParams.get("tab") ?? "videos";

  const csv =
    tab === "channels" ? await channelsCsv() : tab === "ideas" ? await ideasCsv() : await videosCsv();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="youtube-${tab}-${Date.now()}.csv"`,
    },
  });
}
