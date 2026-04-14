import type { AppState, Item, Cluster, Page, Board, User, Intent } from "./types";
import { seedItems, seedClusters, seedPages, seedBoards } from "./data";

const KEYS = {
  user:  "clutch_user",
  items: "clutch_items",
  clusters: "clutch_clusters",
  pages: "clutch_pages",
  boards: "clutch_boards",
  pending: "clutch_pending",
} as const;

// ─── Auth ────────────────────────────────────────────────
export function getUser(): User | null {
  try { return JSON.parse(localStorage.getItem(KEYS.user) ?? "null"); }
  catch { return null; }
}

export function saveUser(user: User) {
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEYS.user);
}

// Simple demo: store hashed emails + name
// In production this would hit an auth API.
const ACCOUNTS_KEY = "clutch_accounts";

type Account = { email: string; passwordHash: string; name: string; id: string };

function hashPassword(pw: string): string {
  // Simple deterministic hash for demo purposes (NOT for production)
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function getAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]"); }
  catch { return []; }
}

export function signUp(name: string, email: string, password: string): User | Error {
  const accounts = getAccounts();
  if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) {
    return new Error("An account with this email already exists.");
  }
  const account: Account = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  const user: User = { id: account.id, name, email: email.toLowerCase(), createdAt: new Date().toISOString() };
  saveUser(user);
  return user;
}

export function signIn(email: string, password: string): User | Error {
  const accounts = getAccounts();
  const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!account) return new Error("No account found with that email.");
  if (account.passwordHash !== hashPassword(password)) return new Error("Incorrect password.");
  const user: User = { id: account.id, name: account.name, email: account.email, createdAt: new Date().toISOString() };
  saveUser(user);
  return user;
}

// ─── App state ───────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadState(): AppState {
  return {
    items:    load(KEYS.items,    seedItems),
    clusters: load(KEYS.clusters, seedClusters),
    pages:    load(KEYS.pages,    seedPages),
    boards:   load(KEYS.boards,   seedBoards),
  };
}

export function saveItems(items: Item[]) { save(KEYS.items, items); }
export function saveClusters(clusters: Cluster[]) { save(KEYS.clusters, clusters); }
export function savePages(pages: Page[]) { save(KEYS.pages, pages); }
export function saveBoards(boards: Board[]) { save(KEYS.boards, boards); }

// ─── Extension bridge ────────────────────────────────────
// Extension saves a pending item to localStorage; we read on mount.
export type PendingCapture = {
  url: string;
  title: string;
  source: string;
  intent: Intent;
};

export function getPendingCapture(): PendingCapture | null {
  try {
    const raw = localStorage.getItem(KEYS.pending);
    if (!raw) return null;
    localStorage.removeItem(KEYS.pending);
    return JSON.parse(raw);
  } catch { return null; }
}

// ─── ML helpers ──────────────────────────────────────────
export function buildTags(title: string, note: string, intent: Intent): string[] {
  const combined = `${title} ${note}`.toLowerCase();
  const tags = new Set<string>();
  if (combined.match(/\bai\b|embedding|semantic|gpt|llm|ml\b/)) tags.add("ai");
  if (combined.match(/student|college|university|learn|course|study/)) tags.add("students");
  if (combined.match(/design|visual|ui|ux|figma|board/)) tags.add("design");
  if (combined.match(/product|startup|growth|workflow|saas/)) tags.add("product");
  if (combined.match(/read|article|essay|book|journal/)) tags.add("reading");
  if (combined.match(/news|breaking|market|economy|politic/)) tags.add("news");
  if (combined.match(/video|youtube|podcast|interview/)) tags.add("video");
  if (combined.match(/research|study|paper|data|science/)) tags.add("research");
  tags.add({ "Read later": "reading", Research: "research", Idea: "ideas", Reference: "reference", Inspiration: "inspiration" }[intent]);
  return Array.from(tags).slice(0, 5);
}

export function buildSummary(title: string, note: string, intent: Intent): string {
  const lead = note
    ? `Saved as ${intent.toLowerCase()} with a note: "${note}".`
    : `Saved as ${intent.toLowerCase()} for a cleaner return later.`;
  return `${lead} — ${title}`.slice(0, 180);
}

export function assignCluster(title: string, note: string, intent: Intent, clusters: Cluster[]): Cluster {
  const combined = `${title} ${note}`.toLowerCase();
  const find = (id: string) => clusters.find(c => c.id === id) ?? clusters[0];
  if (combined.match(/student|college|learn/)) return find("cluster-2");
  if (combined.match(/design|premium|board|visual/)) return find("cluster-3");
  if (combined.match(/\bai\b|embedding|semantic|llm/)) return find("cluster-1");
  if (intent === "Read later") return find("cluster-4");
  if (intent === "Inspiration") return find("cluster-3");
  return find("cluster-1");
}

export function buildCover(source: string): string {
  const palette: [string, string][] = [
    ["#DBE9FA", "#8BB5DF"],
    ["#F8E6DB", "#E0B07F"],
    ["#E0F2E9", "#8CC8AE"],
    ["#EFE3F8", "#B69CDB"],
    ["#FDE8E8", "#F3A0A0"],
    ["#FEFCE8", "#F0D070"],
  ];
  const [start, end] = palette[source.length % palette.length];
  return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
}

export function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 220));
  return `${mins} min read`;
}
