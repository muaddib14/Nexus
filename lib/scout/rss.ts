import Parser from "rss-parser";

export interface FeedItem {
  source: string;
  category: "macro" | "crypto";
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
}

const parser = new Parser({
  timeout: 5000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NexusDeskBot/1.0; +https://nexus.desk)",
  },
});

export const RSS_FEEDS = [
  {
    name: "Reuters Markets",
    category: "macro" as const,
    url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
  },
  {
    name: "CNBC Finance",
    category: "macro" as const,
    url: "https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=markets&category=all&sort=date&format=rss",
  },
  {
    name: "CoinDesk",
    category: "crypto" as const,
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  },
  {
    name: "The Block",
    category: "crypto" as const,
    url: "https://www.theblock.co/rss.xml",
  },
];

export async function fetchAllFeeds(): Promise<{ items: FeedItem[]; logEvents: Array<{ source: string; status: number; count: number; error?: string }> }> {
  const items: FeedItem[] = [];
  const logEvents: Array<{ source: string; status: number; count: number; error?: string }> = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const feedItems = (parsed.items || []).slice(0, 15).map((item) => ({
        source: feed.name,
        category: feed.category,
        title: (item.title || "").trim(),
        link: item.link || "",
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
      }));

      items.push(...feedItems);
      logEvents.push({
        source: feed.name,
        status: 200,
        count: feedItems.length,
      });
    } catch (err: any) {
      logEvents.push({
        source: feed.name,
        status: err.message?.includes("429") ? 429 : 500,
        count: 0,
        error: err.message || "Failed to fetch feed",
      });
    }
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const uniqueItems = items.filter((item) => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { items: uniqueItems, logEvents };
}
