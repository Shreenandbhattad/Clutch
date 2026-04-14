export type Intent = "Read later" | "Research" | "Idea" | "Reference" | "Inspiration";

export type Note = {
  id: string;
  content: string;
  createdAt: string;
};

export type Item = {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;     // short description / OG description
  summary: string;     // AI-generated summary
  tags: string[];
  createdAt: string;
  intent: Intent;
  clusterId: string;
  relatedIds: string[];
  notes: Note[];
  cover: string;       // gradient fallback
  imageUrl?: string;   // OG image from page (shown instead of gradient if available)
  readAt?: string;     // undefined = unread
};

export type Cluster = {
  id: string;
  name: string;
  summary: string;
  itemIds: string[];
  relatedThemes: string[];
  createdAt: string;
};

export type PageBlock =
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "item"; itemId: string }
  | { id: string; type: "note"; content: string };

export type Page = {
  id: string;
  title: string;
  summary: string;
  blocks: PageBlock[];
  linkedItemIds: string[];
  createdAt: string;
  pinned: boolean;
};

export type BoardTone = "cloud" | "linen" | "slate";

export type BoardElement =
  | { id: string; type: "item"; itemId: string; x: number; y: number; width: number; height: number }
  | { id: string; type: "note"; note: string; x: number; y: number; width: number; height: number };

export type Board = {
  id: string;
  title: string;
  tone: BoardTone;
  elements: BoardElement[];
};

export type Suggestion = {
  id: string;
  title: string;
  detail: string;
};

export type ThemePreset = {
  label: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceAlt: string;
  background: string;
  text: string;
  muted: string;
  border: string;
};

export type PlatformGroup = {
  id: string;
  title: string;
  priority: string;
  platforms: string[];
  saves: string[];
};

export type SupportLevel = {
  id: string;
  title: string;
  detail: string;
  bullets: string[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AppState = {
  items: Item[];
  clusters: Cluster[];
  pages: Page[];
  boards: Board[];
};
