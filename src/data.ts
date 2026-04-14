import type {
  Board,
  Cluster,
  Intent,
  Item,
  Page,
  PlatformGroup,
  Suggestion,
  SupportLevel,
  ThemePreset,
} from "./types";

export const intents: Intent[] = [
  "Read later",
  "Research",
  "Idea",
  "Reference",
  "Inspiration",
];

export const themePresets: Record<string, ThemePreset> = {
  calm: {
    label: "Calm",
    accent: "#2f7f73",
    accentSoft: "#dff1ec",
    surface: "#fbf8f1",
    surfaceAlt: "#f3ede0",
    background: "#f6f1e6",
    text: "#1f2a26",
    muted: "#69746f",
    border: "rgba(31, 42, 38, 0.12)",
  },
  focus: {
    label: "Focus",
    accent: "#ae5b2c",
    accentSoft: "#ffe7d5",
    surface: "#fff9f2",
    surfaceAlt: "#f5ead9",
    background: "#f4ecdf",
    text: "#2b2218",
    muted: "#7c7062",
    border: "rgba(43, 34, 24, 0.12)",
  },
  studio: {
    label: "Studio",
    accent: "#1d5fb8",
    accentSoft: "#deecff",
    surface: "#f8fbff",
    surfaceAlt: "#e9f0f9",
    background: "#eef4fa",
    text: "#152236",
    muted: "#61708a",
    border: "rgba(21, 34, 54, 0.12)",
  },
};

export const seedItems: Item[] = [
  {
    id: "item-1",
    title: "Reddit thread on AI note-taking workflows that actually stick",
    url: "https://www.reddit.com/r/productivity/comments/ai_notetaking",
    source: "Reddit",
    snippet: "A long thread comparing how people save articles, videos, and AI answers without losing context. Top comment: 'The problem isn't capturing — it's returning.'",
    summary: "A high-signal discussion about what people really want from saved threads, comments, and follow-up reading.",
    tags: ["social", "ai", "workflow"],
    createdAt: "2026-04-09T09:40:00.000Z",
    intent: "Research",
    clusterId: "cluster-1",
    relatedIds: ["item-4", "item-6"],
    notes: [
      {
        id: "note-1",
        content: "Use this as tone guidance for Clutch prompts and summaries.",
        createdAt: "2026-04-09T09:45:00.000Z",
      },
    ],
    cover: "linear-gradient(135deg, #dcefe9 0%, #accdbf 100%)",
    imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop",
  },
  {
    id: "item-2",
    title: "Reuters explainer on AI regulation and why markets reacted",
    url: "https://www.reuters.com/technology/ai-regulation-explainer",
    source: "Reuters",
    snippet: "A clean explainer linking the headline, the market context, and the next-order effects of the EU AI Act on global tech valuations.",
    summary: "A news article worth saving because it combines breaking context with reusable explanation.",
    tags: ["news", "research", "markets"],
    createdAt: "2026-04-08T16:15:00.000Z",
    intent: "Read later",
    clusterId: "cluster-2",
    relatedIds: ["item-5"],
    notes: [
      {
        id: "note-2",
        content: "This audience feels close to the first Clutch user.",
        createdAt: "2026-04-08T17:10:00.000Z",
      },
    ],
    cover: "linear-gradient(135deg, #f7e8d2 0%, #e6c89e 100%)",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
  },
  {
    id: "item-3",
    title: "Instagram carousel breaking down a startup growth loop",
    url: "https://www.instagram.com/p/startup_growth_loop",
    source: "Instagram",
    snippet: "A visual post with swipeable slides and embedded charts showing a flywheel from content → trust → revenue. Link in bio.",
    summary: "A social save that should be captured as a post first, then upgraded later into richer carousel parsing.",
    tags: ["social", "design", "inspiration"],
    createdAt: "2026-04-07T12:20:00.000Z",
    intent: "Inspiration",
    clusterId: "cluster-3",
    relatedIds: ["item-6"],
    notes: [],
    cover: "linear-gradient(135deg, #f0e8fb 0%, #c5b4e4 100%)",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
  },
  {
    id: "item-4",
    title: "Perplexity: comparing browser clipper strategies across tools",
    url: "https://www.perplexity.ai/search/browser-clipper-comparison",
    source: "Perplexity",
    snippet: "A generated answer comparing Readwise, Notion Web Clipper, and newer tools like Clutch. Cited 14 sources with a clear recommendation matrix.",
    summary: "An AI-generated research thread that belongs in Clutch alongside traditional articles and links.",
    tags: ["ai", "research", "answers"],
    createdAt: "2026-04-09T07:05:00.000Z",
    intent: "Reference",
    clusterId: "cluster-1",
    relatedIds: ["item-1", "item-6"],
    notes: [],
    cover: "linear-gradient(135deg, #dbe7fb 0%, #9db7eb 100%)",
  },
  {
    id: "item-5",
    title: "YouTube lecture on building a personal research system",
    url: "https://example.com/youtube-research-system",
    source: "YouTube",
    snippet: "A practical long-form video on moving from scattered bookmarks to reusable notes and boards.",
    summary: "A video save that shows why Clutch needs clean support for lectures, explainers, podcasts, and clips.",
    tags: ["video", "students", "planning"],
    createdAt: "2026-04-06T14:30:00.000Z",
    intent: "Idea",
    clusterId: "cluster-2",
    relatedIds: ["item-2"],
    notes: [],
    cover: "linear-gradient(135deg, #ffe2dd 0%, #f3a799 100%)",
  },
  {
    id: "item-6",
    title: "WIRED feature on the future of ambient AI interfaces",
    url: "https://example.com/wired-ambient-ai",
    source: "WIRED",
    snippet: "A long-form feature mixing reporting, product critique, and design implications.",
    summary: "A deep-dive article that shows where Clutch shines: rich reading saved for later synthesis.",
    tags: ["deep-dive", "design", "premium"],
    createdAt: "2026-04-08T10:10:00.000Z",
    intent: "Research",
    clusterId: "cluster-3",
    relatedIds: ["item-1", "item-3"],
    notes: [
      {
        id: "note-3",
        content: "Soft spacing and slower motion should be part of the system, not an afterthought.",
        createdAt: "2026-04-08T10:20:00.000Z",
      },
    ],
    cover: "linear-gradient(135deg, #e2f0dc 0%, #a8c59a 100%)",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=200&fit=crop",
  },
];

export const seedClusters: Cluster[] = [
  {
    id: "cluster-1",
    name: "Quiet AI workflows",
    summary: "Summaries, clustering, and retrieval patterns that feel supportive rather than noisy.",
    itemIds: ["item-1", "item-4"],
    relatedThemes: ["search relevance", "background assistance", "semantic grouping"],
    createdAt: "2026-04-09T07:00:00.000Z",
  },
  {
    id: "cluster-2",
    name: "Student systems",
    summary: "Saved reads and planning patterns for learners who need structure without friction.",
    itemIds: ["item-2", "item-5"],
    relatedThemes: ["reading flow", "project boards", "deadlines"],
    createdAt: "2026-04-06T14:00:00.000Z",
  },
  {
    id: "cluster-3",
    name: "Premium product feel",
    summary: "References for calm visual systems, spatial design, and higher-trust interfaces.",
    itemIds: ["item-3", "item-6"],
    relatedThemes: ["boards", "motion", "editorial rhythm"],
    createdAt: "2026-04-07T12:00:00.000Z",
  },
  {
    id: "cluster-4",
    name: "Reading lane",
    summary: "A clean queue for pieces worth returning to when time opens up.",
    itemIds: [],
    relatedThemes: ["later reading", "triage", "return prompts"],
    createdAt: "2026-04-09T18:00:00.000Z",
  },
];

export const seedPages: Page[] = [
  {
    id: "page-1",
    title: "Clutch launch POV",
    summary: "A working page for product voice, premium cues, and core promise.",
    linkedItemIds: ["item-1", "item-6"],
    createdAt: "2026-04-09T18:10:00.000Z",
    pinned: true,
    blocks: [
      { id: "block-1", type: "heading", content: "Clutch should feel calm before it feels clever." },
      {
        id: "block-2",
        type: "text",
        content: "Keep the interface spacious, reduce setup cost, and let AI improve organization in the background.",
      },
      { id: "block-3", type: "item", itemId: "item-1" },
      {
        id: "block-4",
        type: "note",
        content: "Premium comes from reduced effort more than decorative polish.",
      },
    ],
  },
  {
    id: "page-2",
    title: "Student user angle",
    summary: "Early audience framing for users who already save too many things.",
    linkedItemIds: ["item-2", "item-5"],
    createdAt: "2026-04-08T15:20:00.000Z",
    pinned: true,
    blocks: [
      { id: "block-5", type: "heading", content: "The student case is about resurfacing, not just storage." },
      { id: "block-6", type: "item", itemId: "item-2" },
      {
        id: "block-7",
        type: "text",
        content: "Clutch should answer: what did I save, why did I save it, and what else belongs with it?",
      },
    ],
  },
  {
    id: "page-3",
    title: "Board language",
    summary: "Spatial references for turning saved material into thinking surfaces.",
    linkedItemIds: ["item-3"],
    createdAt: "2026-04-07T13:45:00.000Z",
    pinned: false,
    blocks: [
      { id: "block-8", type: "heading", content: "A board is a wall, not a dashboard." },
      { id: "block-9", type: "item", itemId: "item-3" },
    ],
  },
];

export const seedBoards: Board[] = [
  {
    id: "board-1",
    title: "Quiet board",
    tone: "cloud",
    elements: [
      { id: "element-1", type: "item", itemId: "item-1", x: 24, y: 30, width: 250, height: 160 },
      { id: "element-2", type: "item", itemId: "item-3", x: 340, y: 60, width: 230, height: 160 },
      { id: "element-3", type: "note", note: "Connect quiet AI behavior to the board empty state.", x: 180, y: 255, width: 220, height: 130 },
      { id: "element-4", type: "item", itemId: "item-5", x: 610, y: 180, width: 240, height: 160 },
    ],
  },
];

export const seedSuggestions: Suggestion[] = [
  {
    id: "suggestion-1",
    title: "5 new items grouped",
    detail: "Quiet AI workflows gained enough density to become a page.",
  },
  {
    id: "suggestion-2",
    title: "One note still empty",
    detail: "The premium product feel cluster has a save with no user context yet.",
  },
  {
    id: "suggestion-3",
    title: "Return prompt",
    detail: "Your student systems page could use one more reference item.",
  },
];

export const platformGroups: PlatformGroup[] = [
  {
    id: "social",
    title: "Social platforms",
    priority: "High priority",
    platforms: ["Instagram", "X", "LinkedIn", "Reddit", "Facebook", "Threads"],
    saves: ["posts", "threads", "carousels", "comments", "links inside posts"],
  },
  {
    id: "news",
    title: "News platforms",
    priority: "Very high priority",
    platforms: ["BBC News", "Reuters", "The Guardian", "The Wall Street Journal", "Bloomberg", "CNBC"],
    saves: ["full articles", "opinion pieces", "breaking news", "explainers"],
  },
  {
    id: "knowledge",
    title: "Deep-dive and knowledge content",
    priority: "High-value reads",
    platforms: ["WIRED", "New Scientist", "The Conversation", "Harvard Business Review", "Aeon"],
    saves: ["long-form articles", "research-backed writing", "essays", "visual stories"],
  },
  {
    id: "ai",
    title: "AI tools and generated content",
    priority: "Important and growing",
    platforms: ["Perplexity", "ChatGPT", "Claude"],
    saves: ["AI answers", "research threads", "generated insights"],
  },
  {
    id: "web",
    title: "Random web pages",
    priority: "Must support",
    platforms: ["Blogs", "docs pages", "landing pages", "PDFs", "search results", "random URLs"],
    saves: ["any useful page", "documentation", "references", "links worth revisiting"],
  },
];

export const supportLevels: SupportLevel[] = [
  {
    id: "level-1",
    title: "Level 1",
    detail: "MVP must-have",
    bullets: ["URL capture", "title extraction", "thumbnail", "basic summary"],
  },
  {
    id: "level-2",
    title: "Level 2",
    detail: "Good upgrade",
    bullets: ["detect article vs thread vs video", "extract main content", "better summaries"],
  },
  {
    id: "level-3",
    title: "Level 3",
    detail: "Future structure",
    bullets: ["structured parsing", "multi-part saves like X threads", "comments, highlights, and richer relationships"],
  },
];
