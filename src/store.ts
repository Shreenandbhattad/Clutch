import type { AppState, Item, Cluster, Page, User, Intent } from "./types";
import { seedItems, seedClusters, seedPages } from "./data";
import { supabase } from "./supabase";

// ─── localStorage cache keys ─────────────────────────────
const KEYS = {
  items:    "clutch_items",
  clusters: "clutch_clusters",
  pages:    "clutch_pages",
  pending:  "clutch_pending",
} as const;

// ─── Auth (Supabase) ─────────────────────────────────────
export async function signUp(name: string, email: string, password: string): Promise<User | Error> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return new Error(error.message);
  if (!data.user) return new Error("Sign-up failed. Please try again.");
  return {
    id:        data.user.id,
    name:      name,
    email:     data.user.email ?? email,
    createdAt: data.user.created_at,
  };
}

export async function signIn(email: string, password: string): Promise<User | Error> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return new Error(error.message);
  if (!data.user) return new Error("Sign-in failed. Please try again.");
  return {
    id:        data.user.id,
    name:      data.user.user_metadata?.name ?? email.split("@")[0],
    email:     data.user.email ?? email,
    createdAt: data.user.created_at,
  };
}

export function getUser(): User | null {
  // Sync read from Supabase session cache (set after login)
  const raw = localStorage.getItem("clutch_sb_user");
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function clearUser() {
  localStorage.removeItem("clutch_sb_user");
  supabase.auth.signOut();
}

// ─── Supabase DB ─────────────────────────────────────────
export async function loadFromSupabase(userId: string): Promise<AppState | null> {
  const { data, error } = await supabase
    .from("user_saves")
    .select("items, clusters, pages")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    items:    data.items    ?? seedItems,
    clusters: data.clusters ?? seedClusters,
    pages:    data.pages    ?? seedPages,
    boards:   [],
  };
}

export async function syncToSupabase(
  userId: string,
  items: Item[],
  clusters: Cluster[],
  pages: Page[]
) {
  await supabase.from("user_saves").upsert(
    { user_id: userId, items, clusters, pages, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

// ─── localStorage cache (fast local reads/writes) ────────
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
    boards:   [],
  };
}

export function saveItems(items: Item[])         { save(KEYS.items,    items); }
export function saveClusters(c: Cluster[])       { save(KEYS.clusters, c); }
export function savePages(p: Page[])             { save(KEYS.pages,    p); }

// ─── Extension bridge ────────────────────────────────────
export type PendingCapture = { url: string; title: string; source: string; intent: Intent };

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
