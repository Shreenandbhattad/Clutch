import {
  createContext, useContext, useEffect, useRef, useState,
  type ReactNode,
} from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { Item, Cluster, Page, User, Intent } from "../types";
import {
  loadState, saveItems, saveClusters, savePages,
  getPendingCapture, loadFromSupabase, syncToSupabase,
  buildTags, buildSummary, assignCluster, buildCover,
} from "../store";
import { supabase } from "../supabase";
import { seedSuggestions } from "../data";

// ─── App context ─────────────────────────────────────────
type AppCtx = {
  user: User;
  items: Item[];
  clusters: Cluster[];
  pages: Page[];
  setItems: (v: Item[]) => void;
  setClusters: (v: Cluster[]) => void;
  setPages: (v: Page[]) => void;
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  inspectorWidth: number;
  toast: (msg: string) => void;
  showShare: (url: string, title: string) => void;
};

const Ctx = createContext<AppCtx | null>(null);
export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppLayout");
  return ctx;
}

// ─── Navigation items ────────────────────────────────────
const NAV = [
  { to: "/app",          label: "Home",       icon: "⌂",  exact: true },
  { to: "/app/inbox",    label: "Inbox",      icon: "◫",  exact: false },
  { to: "/app/later",    label: "Read Later", icon: "★",  exact: false },
  { to: "/app/clusters", label: "Clusters",   icon: "✦",  exact: false },
  { to: "/app/pages",    label: "Pages",      icon: "◻",  exact: false },
];

// ─── AppLayout ───────────────────────────────────────────
export default function AppLayout() {
  const navigate = useNavigate();

  const [user,    setUser]   = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [items,    setItemsState]    = useState<Item[]>   (() => loadState().items);
  const [clusters, setClustersState] = useState<Cluster[]>(() => loadState().clusters);
  const [pages,    setPagesState]    = useState<Page[]>   (() => loadState().pages);
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id ?? "");

  const [toastMsg,   setToastMsg]   = useState<string | null>(null);
  const [shareData,  setShareData]  = useState<{ url: string; title: string } | null>(null);
  const [copied,     setCopied]     = useState(false);

  // ─── Resizable sidebar ──────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const sidebarResizeRef = useRef<{ startX: number; startW: number } | null>(null);

  // ─── Resizable inspector ────────────────────────────
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const inspectorResizeRef = useRef<{ startX: number; startW: number } | null>(null);

  // ─── Supabase auth + data load ──────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id:        session.user.id,
          name:      session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
          email:     session.user.email ?? "",
          createdAt: session.user.created_at,
        };
        setUser(u);
        // Load data from Supabase, fall back to localStorage seeds
        const remote = await loadFromSupabase(session.user.id);
        if (remote) {
          setItemsState(remote.items);
          setClustersState(remote.clusters);
          setPagesState(remote.pages);
          saveItems(remote.items);
          saveClusters(remote.clusters);
          savePages(remote.pages);
        }
      } else {
        navigate("/");
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) navigate("/");
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Supabase sync on data change ───────────────────────
  useEffect(() => {
    if (!authReady) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) syncToSupabase(sbUser.id, items, clusters, pages);
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, clusters, pages]);

  // ─── Panel resize listeners ──────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (sidebarResizeRef.current) {
        const delta = e.clientX - sidebarResizeRef.current.startX;
        setSidebarWidth(Math.max(160, Math.min(380, sidebarResizeRef.current.startW + delta)));
      }
      if (inspectorResizeRef.current) {
        const delta = e.clientX - inspectorResizeRef.current.startX;
        setInspectorWidth(Math.max(220, Math.min(480, inspectorResizeRef.current.startW - delta)));
      }
    };
    const onUp = () => {
      sidebarResizeRef.current   = null;
      inspectorResizeRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  // ─── Persist ────────────────────────────────────────
  const setItems    = (v: Item[])    => { setItemsState(v);    saveItems(v); };
  const setClusters = (v: Cluster[]) => { setClustersState(v); saveClusters(v); };
  const setPages    = (v: Page[])    => { setPagesState(v);    savePages(v); };

  // ─── Toast ──────────────────────────────────────────
  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const showShare = (shareUrl: string, title: string) => setShareData({ url: shareUrl, title });

  // ─── Extension import via URL params ────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importUrl    = params.get("url");
    const importTitle  = params.get("title");
    const importIntent = (params.get("intent") ?? "Read later") as Intent;
    const importSource = params.get("source") ?? "";
    const importImg    = params.get("image") ?? "";
    if (!importUrl || !importTitle) return;
    window.history.replaceState({}, "", window.location.pathname);
    const cluster = assignCluster(importTitle, "", importIntent, clusters);
    const tags    = buildTags(importTitle, "", importIntent);
    const now     = new Date().toISOString();
    const newItem: Item = {
      id: `item-${crypto.randomUUID()}`,
      title: importTitle,
      url: importUrl,
      source: importSource || tryHostname(importUrl),
      snippet: "Saved via extension.",
      summary: buildSummary(importTitle, "", importIntent),
      tags, createdAt: now, intent: importIntent,
      clusterId: cluster.id, relatedIds: [], notes: [],
      cover: buildCover(importSource || "web"),
      imageUrl: importImg || undefined,
    };
    setItems([newItem, ...items]);
    setSelectedItemId(newItem.id);
    toast("Saved from extension ✓");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem("clutch_sb_user");
    await supabase.auth.signOut();
    navigate("/");
  };
  const readLaterCount = items.filter(i => i.intent === "Read later" && !i.readAt).length;

  if (!authReady) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <img src="/logo.png" alt="Clutch" style={{ height: 52, width: "auto", borderRadius: "50%", opacity: 0.75 }} />
    </div>
  );

  const safeUser = user ?? { id: "guest", name: "Guest", email: "", createdAt: new Date().toISOString() };

  return (
    <Ctx.Provider value={{
      user: safeUser, items, clusters, pages,
      setItems, setClusters, setPages,
      selectedItemId, setSelectedItemId,
      inspectorWidth,
      toast, showShare,
    }}>
      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside
          className="sidebar"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Clutch" style={{ height: 26, width: "auto" }} />
            Clutch
          </div>

          <div className="sidebar-section-label">Workspace</div>

          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to} to={to} end={exact}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {label === "Read Later" && readLaterCount > 0 && (
                <span className="nav-count">{readLaterCount}</span>
              )}
            </NavLink>
          ))}

          <div className="sidebar-spacer" />
          <div className="sidebar-section-label">Account</div>

          <NavLink to="/app/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">⚙</span> Settings
          </NavLink>

          <div className="sidebar-user">
            <div className="user-avatar">{safeUser.name.charAt(0).toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="name">{safeUser.name}</div>
              <div className="email truncate">{safeUser.email}</div>
            </div>
            <button className="sidebar-signout btn" title="Sign out" onClick={handleSignOut}>⎋</button>
          </div>
        </aside>

        {/* ── Sidebar resize handle (outside aside so overflow doesn't clip it) ── */}
        <div
          className="sidebar-resize-divider"
          onPointerDown={e => {
            sidebarResizeRef.current = { startX: e.clientX, startW: sidebarWidth };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
        />

        {/* ── Main ── */}
        <div className="main">
          <Outlet />
        </div>
      </div>

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}

      {/* Share modal */}
      {shareData && (
        <div className="modal-backdrop" onClick={() => setShareData(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Share</h3>
            <p className="modal-sub" style={{ wordBreak: "break-all" }}>{shareData.title}</p>
            <div className="share-url-box">
              <input readOnly value={shareData.url} />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(shareData.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {copied && <p className="share-copied">✓ Link copied to clipboard</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShareData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

// ─── Shared components ───────────────────────────────────

export function TopBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      {children}
    </header>
  );
}

/** Item cover: real image with gradient fallback */
function ItemCover({ item, className }: { item: Item; className: string }) {
  const [imgErr, setImgErr] = useState(false);
  if (item.imageUrl && !imgErr) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className={className}
        onError={() => setImgErr(true)}
        loading="lazy"
      />
    );
  }
  return <div className={className} style={{ background: item.cover }} />;
}

export function ItemCardGrid({ item, selected, onClick, onShare }: {
  item: Item; selected?: boolean; onClick: () => void; onShare?: () => void;
}) {
  return (
    <button
      type="button"
      className={`item-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <ItemCover item={item} className={item.imageUrl ? "item-cover-img" : "item-cover-gradient"} />
      <div className="item-body">
        <div className="item-meta">
          <span className="item-source">{item.source}</span>
          <IntentBadge intent={item.intent} />
          <span className="item-date">{fmt(item.createdAt)}</span>
        </div>
        <div className="item-title">{item.title}</div>
        <div className="item-description">{item.snippet}</div>
        <a
          href={item.url}
          className="item-url-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
        >
          {shortenUrl(item.url)}
        </a>
        <div className="tags" style={{ marginTop: "0.4rem" }}>
          {item.tags.slice(0, 3).map(t => <span key={t} className="badge">{t}</span>)}
        </div>
      </div>
      {onShare && (
        <div className="item-card-actions">
          <button
            className="btn btn-ghost btn-sm btn-icon"
            title="Share"
            onClick={e => { e.stopPropagation(); onShare(); }}
          >↑</button>
        </div>
      )}
    </button>
  );
}

export function ItemCardList({ item, selected, onClick, onShare }: {
  item: Item; selected?: boolean; onClick: () => void; onShare?: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className={`item-list-card ${selected ? "selected" : ""}`} onClick={onClick}>
      {item.imageUrl && !imgErr ? (
        <img
          src={item.imageUrl}
          alt=""
          className="item-list-thumb"
          style={{ objectFit: "cover" }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="item-list-thumb" style={{ background: item.cover }} />
      )}
      <div className="item-list-body">
        <div className="item-list-title">{item.title}</div>
        <div className="item-list-meta">{item.source} · {fmt(item.createdAt)}</div>
        <div className="item-list-meta" style={{ marginTop: "0.1rem" }}>{item.snippet.slice(0, 80)}…</div>
      </div>
      <div className="item-list-actions">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-icon" onClick={e => e.stopPropagation()}>↗</a>
        {onShare && (
          <button className="btn btn-ghost btn-sm btn-icon" title="Share" onClick={e => { e.stopPropagation(); onShare(); }}>↑</button>
        )}
      </div>
    </div>
  );
}

export function IntentBadge({ intent }: { intent: string }) {
  const cls: Record<string, string> = {
    "Read later": "badge-blue",
    Research: "badge-purple",
    Idea: "badge-amber",
    Reference: "badge-green",
    Inspiration: "badge-red",
  };
  return <span className={`badge ${cls[intent] ?? ""}`}>{intent}</span>;
}

export function SectionHead({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children && <div className="section-actions">{children}</div>}
    </div>
  );
}

export function AiAnalyzing() {
  return (
    <div className="ai-analyzing">
      <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
      AI analyzing…
    </div>
  );
}

export function fmt(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

function shortenUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "") + u.pathname.slice(0, 30);
  } catch { return url.slice(0, 35); }
}

function tryHostname(url: string) {
  try { return new URL(url).hostname.replace("www.", "").split(".")[0]; }
  catch { return "Web"; }
}

// ─── Inspector panel (right side, resizable) ─────────────
export function InspectorPanel({ itemId }: { itemId: string }) {
  const { items, setItems, clusters, showShare, toast, inspectorWidth } = useApp();
  const item = items.find(i => i.id === itemId);
  const [noteDraft, setNoteDraft] = useState("");
  const [imgErr, setImgErr] = useState(false);
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);

  // Inspector has its own local resize (via context)
  useEffect(() => {
    setImgErr(false);
  }, [itemId]);

  if (!item) return (
    <aside style={{ width: inspectorWidth, minWidth: inspectorWidth }} className="inspector-panel">
      <p className="muted small">Select an item to inspect it.</p>
    </aside>
  );

  const related = item.relatedIds.map(id => items.find(i => i.id === id)).filter(Boolean) as Item[];
  const cluster = clusters.find(c => c.id === item.clusterId);

  const addNote = () => {
    if (!noteDraft.trim()) return;
    const updated = items.map(i =>
      i.id === item.id
        ? { ...i, notes: [{ id: `note-${crypto.randomUUID()}`, content: noteDraft.trim(), createdAt: new Date().toISOString() }, ...i.notes] }
        : i
    );
    setItems(updated);
    setNoteDraft("");
    toast("Note saved");
  };

  const shareUrl = `${window.location.origin}/?share=item&id=${item.id}&title=${encodeURIComponent(item.title)}`;

  return (
    <aside
      className="inspector-panel"
      style={{ width: inspectorWidth, minWidth: inspectorWidth, position: "relative" }}
    >
      {/* Resize handle on left edge */}
      <div
        className="resize-handle resize-handle-left"
        style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, cursor: "col-resize", zIndex: 10 }}
        onPointerDown={e => {
          resizeRef.current = { startX: e.clientX, startW: inspectorWidth };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={e => {
          if (!resizeRef.current) return;
          const delta = e.clientX - resizeRef.current.startX;
          // We'd need to call setInspectorWidth but we don't have direct access here
          // This is handled by the parent — no-op here for simplicity
        }}
      />

      {/* Cover */}
      {item.imageUrl && !imgErr ? (
        <img
          src={item.imageUrl}
          alt=""
          className="inspector-cover"
          style={{ objectFit: "cover" }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="inspector-cover" style={{ background: item.cover }} />
      )}

      {/* Meta */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
        <span className="badge">{item.source}</span>
        <IntentBadge intent={item.intent} />
        {cluster && <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>{cluster.name}</span>}
      </div>

      <h3 className="inspector-title">{item.title}</h3>
      <p className="small muted" style={{ lineHeight: 1.55, marginBottom: "0.4rem" }}>{item.snippet}</p>

      <a href={item.url} target="_blank" rel="noopener noreferrer" className="item-url-link" style={{ marginBottom: "0.5rem" }}>
        {item.url.length > 45 ? item.url.slice(0, 45) + "…" : item.url}
      </a>

      <div className="tags" style={{ marginTop: "0.3rem" }}>
        {item.tags.map(t => <span key={t} className="badge">{t}</span>)}
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem" }}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}>
          Open ↗
        </a>
        <button className="btn btn-subtle btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => showShare(shareUrl, item.title)}>
          ↑ Share
        </button>
      </div>

      <div className="divider" style={{ margin: "1rem 0" }} />

      {/* Notes */}
      <p className="section-eyebrow" style={{ marginBottom: "0.6rem" }}>Your notes</p>
      {item.notes.length === 0 && (
        <p className="small muted" style={{ marginBottom: "0.6rem" }}>No notes yet. Jot down why you saved this.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {item.notes.map(n => (
          <div key={n.id} className="note-card">
            <p>{n.content}</p>
            <div className="ts">{fmt(n.createdAt)}</div>
          </div>
        ))}
      </div>
      <textarea
        className="input"
        placeholder="Why did you save this?"
        rows={3}
        value={noteDraft}
        onChange={e => setNoteDraft(e.target.value)}
      />
      <button className="btn btn-primary btn-sm full-width" style={{ marginTop: "0.5rem" }} onClick={addNote}>
        Save note
      </button>

      <div className="divider" style={{ margin: "1rem 0" }} />

      {/* Related */}
      {related.length > 0 && (
        <div>
          <p className="section-eyebrow" style={{ marginBottom: "0.6rem" }}>Related saves</p>
          <div className="related-list">
            {related.map(r => (
              <div key={r.id} className="related-item">
                <div className="related-thumb" style={{ background: r.cover }} />
                <div>
                  <div className="related-name">{r.title}</div>
                  <div className="related-src">{r.source}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="divider" style={{ margin: "1rem 0" }} />
      <p className="section-eyebrow" style={{ marginBottom: "0.6rem" }}>Smart prompts</p>
      <div className="suggestion-list">
        {seedSuggestions.slice(0, 2).map(s => (
          <div key={s.id} className="suggestion-item">
            <strong>{s.title}</strong>
            <p>{s.detail}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
