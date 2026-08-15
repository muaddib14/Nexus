export interface WeaveArticle {
  issue: string; // e.g. "WEAVE 004"
  slug: string;
  date: string;
  readTime: string;
  title: string;
  dek: string;
  threadsSummary: string;
  tags: string[];
  threadsWoven: Array<{
    dispatchId: string;
    crossing: string;
    date: string;
  }>;
  sources: Array<{
    name: string;
    url: string;
  }>;
  content: string[];
}

export const weaveArticles: WeaveArticle[] = [
  {
    issue: "WEAVE 004",
    slug: "when-dollar-liquidity-unwinds-the-crypto-proxy-contracts",
    date: "12 Aug 2026",
    readTime: "6 min read",
    title: "When Dollar Liquidity Unwinds, the Crypto Proxy Contracts First",
    dek: "Connecting three distinct sessions of front-end dollar tightening with the quiet contraction in perpetual funding and aggregate stablecoin float across major venues.",
    threadsSummary: "7 threads woven · 14 sources",
    tags: ["macro", "crypto", "liquidity"],
    threadsWoven: [
      { dispatchId: "#104", crossing: "dollar funding ✕ stablecoin supply", date: "9 Aug" },
      { dispatchId: "#098", crossing: "rate path ✕ perp funding", date: "7 Aug" },
      { dispatchId: "#091", crossing: "energy print ✕ risk appetite", date: "6 Aug" },
    ],
    sources: [
      { name: "Reuters — Short-Term Dollar Funding Markets", url: "https://reuters.com" },
      { name: "CoinDesk — Aggregate Stablecoin Supply Contraction", url: "https://coindesk.com" },
      { name: "Financial Times — Front-End Yield Dynamics", url: "https://ft.com" },
      { name: "The Block — Perpetual Futures Funding Rate Metric", url: "https://theblock.co" },
    ],
    content: [
      "Over the course of the last four trading sessions, two seemingly disconnected market ecosystems have executed a synchronized dance that neither participant explicitly negotiated. In the traditional money markets, front-end repo rates and short-dated dollar benchmarks began experiencing subtle upward friction — the kind of friction that rarely makes front-page headlines but invariably dictates the velocity of balance sheet expansion across prime brokers.",
      "Simultaneously, across the primary digital asset liquidity hubs, aggregate stablecoin circulating supply recorded its second consecutive weekly contraction. To a superficial observer viewing each tape in isolation, one is a routine liquidity adjustment in domestic funding, while the other is idiosyncratic crypto churn. Viewed at the crossing, however, they are two mirrors reflecting the exact same economic imperative.",
      "The transmission mechanism is remarkably straightforward once the underlying plumbing is exposed. Stablecoins do not exist in a vacuum; their reserves are overwhelmingly anchored in short-dated U.S. Treasury bills, overnight reverse repo facilities, and direct commercial bank cash equivalents. When the opportunity cost of holding risk-free cash outside the crypto perimeter rises, institutional arbitrage desks quietly redeem digital proxies to capture risk-free yield in traditional rails.",
      "What makes this particular window compelling is the corresponding drift in perpetual futures funding rates. Rather than signaling an outright bearish capitulation, the funding drift reveals an orderly deleveraging — capital is not fleeing in panic, but rather being methodically reallocated to meet collateral demands elsewhere in the global dollar clearing system.",
      "The desk does not forecast where this equilibrium will settle. What we can document, on the record and without speculation, is that the elasticity connecting traditional liquidity conditions with digital asset market depth is tighter now than at any point during the preceding cycle. If funding pressures ease into next week's central bank calendar, the proxy contraction should halt; if dollar friction persists, expect the digital perimeter to adjust accordingly."
    ],
  },
  {
    issue: "WEAVE 003",
    slug: "the-anatomy-of-a-macro-print-false-alarm",
    date: "05 Aug 2026",
    readTime: "5 min read",
    title: "The Anatomy of a Macro Print False Alarm",
    dek: "Why the immediate headline volatility following major economic prints often dissipates before reaching structural crypto liquidity venues.",
    threadsSummary: "5 threads woven · 10 sources",
    tags: ["energy", "volatility", "perps"],
    threadsWoven: [
      { dispatchId: "#091", crossing: "energy print ✕ risk appetite", date: "4 Aug" },
      { dispatchId: "#087", crossing: "treasury auctions ✕ spot volume", date: "2 Aug" },
    ],
    sources: [
      { name: "CNBC — Energy Price Index Print", url: "https://cnbc.com" },
      { name: "Yahoo Finance — Cross-Asset Risk Appetite Index", url: "https://finance.yahoo.com" },
    ],
    content: [
      "When headline energy prints diverge from consensus forecasts, automated trading algorithms routinely trigger initial spikes across high-beta risk instruments. Yet within sixty minutes of market open, these algorithmic impulses frequently stall as deep balance sheet liquidity providers decline to participate.",
      "In this analysis, the desk tracks the specific points where headline momentum failed to translate into structural perpetual funding changes or spot accumulation, illustrating why first-order reactions are frequently noise."
    ],
  },
];
