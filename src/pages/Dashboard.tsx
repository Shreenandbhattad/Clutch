import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Intent } from "../types";
import { useApp, TopBar, SectionHead, ItemCardGrid, AiAnalyzing, fmt } from "./AppLayout";
import { intents, seedSuggestions } from "../data";
import { buildTags, buildSummary, assignCluster, buildCover } from "../store";

type Draft = {
  url: string;
  title: string;
  description: string;
  intent: Intent;
};

// Try to extract hostname for source name
function extractSource(url: string) {
  try {
    const h = new URL(url).hostname.replace("www.", "");
    const parts = h.split(".");
    const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch { return "Web"; }
}

// Extract favicon URL from a domain
function faviconUrl(url: string) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch { return ""; }
}

export default function Dashboard() {
  const { user, items, clusters, pages, setItems, setClusters, setSelectedItemId, toast } = useApp();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<Draft>({
    url: "",
    title: "",
    description: "",
    intent: "Read later",
  });
  const [saving,   setSaving]   = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const [favicon,  setFavicon]  = useState("");

  // Auto-fill source when URL changes
  useEffect(() => {
    if (!draft.url.trim()) { setFavicon(""); return; }
    setFavicon(faviconUrl(draft.url));
  }, [draft.url]);

  const recentItems = [...items]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 4);

  const readLaterCount = items.filter(i => i.intent === "Read later" && !i.readAt).length;
  const activeClusters = clusters.filter(c => c.itemIds.length > 0).length;

  const handleSave = () => {
    const url   = draft.url.trim();
    const title = draft.title.trim() || (url ? extractSource(url) + " article" : "Untitled save");
    const desc  = draft.description.trim();
    const src   = url ? extractSource(url) : "Web";

    setSaving(true);
    setAiActive(true);

    setTimeout(() => {
      const cluster  = assignCluster(title, desc, draft.intent, clusters);
      const tags     = buildTags(title, desc, draft.intent);
      const now      = new Date().toISOString();
      const relatedIds = items
        .filter(i => i.clusterId === cluster.id || i.tags.some(t => tags.includes(t)))
        .slice(0, 3)
        .map(i => i.id);

      const newItem = {
        id: `item-${crypto.randomUUID()}`,
        title,
        url: url || `https://${src.toLowerCase()}.com`,
        source: src,
        snippet: desc || "Saved from the web for a calmer return later.",
        summary: buildSummary(title, desc, draft.intent),
        tags,
        createdAt: now,
        intent: draft.intent,
        clusterId: cluster.id,
        relatedIds,
        notes: desc ? [{ id: `note-${crypto.randomUUID()}`, content: desc, createdAt: now }] : [],
        cover: buildCover(src),
        imageUrl: undefined, // will be filled by extension when available
      };

      setItems([newItem, ...items]);
      setClusters(clusters.map(c =>
        c.id === cluster.id ? { ...c, itemIds: [newItem.id, ...c.itemIds] } : c
      ));
      setSelectedItemId(newItem.id);
      setDraft({ url: "", title: "", description: "", intent: "Read later" });
      setSaving(false);
      setAiActive(false);
      toast(`Saved to "${cluster.name}" ✓`);
      navigate("/app/inbox");
    }, 750);
  };

  const coverBg = draft.url
    ? buildCover(extractSource(draft.url))
    : "linear-gradient(135deg, #D4EDE1, #8EC8AA)";

  return (
    <>
      <TopBar title={`Good ${greeting()}, ${user.name.split(" ")[0]} 👋`}>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/app/later")}>
            Read Later ({readLaterCount})
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/app/inbox")}>
            View Inbox
          </button>
        </div>
      </TopBar>

      <div className="page">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total saves</div>
            <div className="stat-value">{items.length}</div>
            <div className="stat-sub">across all sources</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Read later</div>
            <div className="stat-value" style={{ color: "var(--accent)" }}>{readLaterCount}</div>
            <div className="stat-sub">items queued</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Clusters</div>
            <div className="stat-value">{activeClusters}</div>
            <div className="stat-sub">active topics</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pages</div>
            <div className="stat-value">{pages.length}</div>
            <div className="stat-sub">building spaces</div>
          </div>
        </div>

        {/* Capture + Sidebar widgets */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,0.85fr)", gap: "1.5rem" }}>
          {/* ── Save card ── */}
          <div className="capture-card">
            <SectionHead eyebrow="Quick save" title="Save an article, link, or idea">
              {aiActive && <AiAnalyzing />}
            </SectionHead>

            {/* Live preview strip */}
            <div className="capture-preview" style={{ background: coverBg }}>
              <div className="capture-overlay">
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  {favicon && <img src={favicon} alt="" style={{ width: 14, height: 14, borderRadius: 3 }} />}
                  <div className="source">{draft.url ? extractSource(draft.url) : "Web"}</div>
                </div>
                <div className="title">
                  {draft.title || (draft.url ? extractSource(draft.url) + " article" : "Paste a link to get started…")}
                </div>
                {draft.description && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {draft.description}
                  </div>
                )}
              </div>
            </div>

            <div className="capture-form">
              {/* URL */}
              <div>
                <label className="input-label">Link (URL)</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://example.com/article"
                  value={draft.url}
                  onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
                />
              </div>

              {/* Title */}
              <div>
                <label className="input-label">Title</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Article title or headline"
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="input-label">Description / Note</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="What's this about? Why are you saving it? (optional)"
                  value={draft.description}
                  onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                />
              </div>

              {/* Intent */}
              <div>
                <label className="input-label">Intent</label>
                <div className="intent-map">
                  {intents.map(intent => (
                    <button
                      key={intent}
                      type="button"
                      className={`intent-chip ${draft.intent === intent ? "active" : ""}`}
                      onClick={() => setDraft(d => ({ ...d, intent }))}
                    >
                      {intent}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary full-width"
                onClick={handleSave}
                disabled={saving || (!draft.url.trim() && !draft.title.trim())}
              >
                {saving ? "Saving…" : "Save to Clutch →"}
              </button>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* AI insights */}
            <div className="ai-card">
              <div className="ai-card-head">
                <span className="ai-badge">AI</span>
                <span className="small" style={{ fontWeight: 700 }}>What's happening</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {seedSuggestions.map(s => (
                  <div key={s.id} className="suggestion-item">
                    <strong>{s.title}</strong>
                    <p>{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <p className="section-eyebrow" style={{ marginBottom: "0.75rem" }}>Quick actions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button className="btn btn-subtle full-width" style={{ justifyContent: "flex-start" }} onClick={() => navigate("/app/later")}>
                  ★ Read Later queue ({readLaterCount})
                </button>
                <button className="btn btn-subtle full-width" style={{ justifyContent: "flex-start" }} onClick={() => navigate("/app/clusters")}>
                  ✦ Explore AI cluster canvas
                </button>
                <button className="btn btn-subtle full-width" style={{ justifyContent: "flex-start" }} onClick={() => navigate("/app/pages")}>
                  ◻ Open Pages
                </button>
              </div>
            </div>

            {/* Extension tip */}
            <div className="card" style={{ padding: "1.25rem", background: "linear-gradient(135deg, #E8F5EE, #D4EDE1)", border: "1px solid rgba(0,105,62,0.12)" }}>
              <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.4rem" }}>Save faster with the extension</p>
              <p className="small muted" style={{ lineHeight: 1.55, marginBottom: "0.75rem" }}>
                Install the Clutch Chrome extension to clip any article in one click — URL, title, and description auto-filled.
              </p>
              <a href="/clutch-extension.zip" className="btn btn-primary btn-sm" download>
                ↓ Download Extension
              </a>
            </div>
          </div>
        </div>

        {/* Recent saves */}
        {recentItems.length > 0 && (
          <div>
            <SectionHead eyebrow="Recent activity" title="Latest saves">
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/app/inbox")}>See all →</button>
            </SectionHead>
            <div className="items-grid" style={{ marginTop: "1rem" }}>
              {recentItems.map(item => (
                <ItemCardGrid
                  key={item.id}
                  item={item}
                  onClick={() => { setSelectedItemId(item.id); navigate("/app/inbox"); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
