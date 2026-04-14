import { useApp, TopBar, SectionHead, IntentBadge, fmt } from "./AppLayout";
import { estimateReadTime } from "../store";

export default function ReadLater() {
  const { items, setItems, setSelectedItemId, showShare, toast } = useApp();

  const queue = items
    .filter(i => i.intent === "Read later" && !i.readAt)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const done = items
    .filter(i => i.intent === "Read later" && !!i.readAt)
    .sort((a, b) => +new Date(b.readAt!) - +new Date(a.readAt!))
    .slice(0, 5);

  const markRead = (id: string) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, readAt: new Date().toISOString() } : i
    ));
    toast("Marked as read ✓");
  };

  const unmarkRead = (id: string) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, readAt: undefined } : i
    ));
  };

  const removeFromLater = (id: string) => {
    // Change intent to "Reference" so it stays in inbox but leaves read later
    setItems(items.map(i =>
      i.id === id ? { ...i, intent: "Reference" } : i
    ));
    toast("Removed from Read Later");
  };

  const shareUrl = (id: string, title: string) =>
    `${window.location.origin}/?share=item&id=${id}&title=${encodeURIComponent(title)}`;

  return (
    <>
      <TopBar title="Read Later">
        <div className="topbar-actions">
          <span className="badge badge-blue">{queue.length} to read</span>
          {queue.length > 0 && (
            <span className="small muted">
              ~{queue.reduce((acc, i) => acc + parseInt(estimateReadTime(i.title + " " + i.snippet), 10), 0)} min total
            </span>
          )}
        </div>
      </TopBar>

      <div className="page">
        {/* Queue */}
        <div>
          <SectionHead eyebrow="Your queue" title="Up next">
          </SectionHead>

          {queue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">★</div>
              <h3>Queue is clear</h3>
              <p>When you save something as "Read later", it appears here in a clean, focused list.</p>
            </div>
          ) : (
            <div className="read-later-list" style={{ marginTop: "1rem" }}>
              {queue.map(item => (
                <div key={item.id} className="rl-card">
                  <div
                    className="rl-thumb"
                    style={{ background: item.cover, cursor: "pointer" }}
                    onClick={() => setSelectedItemId(item.id)}
                  />
                  <div className="rl-body">
                    <div
                      className="rl-title"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      {item.title}
                    </div>
                    <div className="rl-meta">
                      <span>{item.source}</span>
                      <span>{fmt(item.createdAt)}</span>
                      <span className="rl-read-time">⏱ {estimateReadTime(item.title + " " + item.snippet)}</span>
                      {item.notes.length > 0 && (
                        <span>💬 {item.notes.length} note{item.notes.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div className="tags" style={{ marginTop: "0.35rem" }}>
                      {item.tags.slice(0, 3).map(t => <span key={t} className="badge">{t}</span>)}
                    </div>
                  </div>
                  <div className="rl-actions">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      title="Open original"
                    >
                      ↗
                    </a>
                    <button
                      className="btn btn-subtle btn-sm"
                      title="Share"
                      onClick={() => showShare(shareUrl(item.id, item.title), item.title)}
                    >
                      ↑
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      title="Mark as read"
                      onClick={() => markRead(item.id)}
                    >
                      ✓ Done
                    </button>
                    <button
                      className="btn btn-subtle btn-sm btn-icon"
                      title="Remove from Read Later"
                      onClick={() => removeFromLater(item.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Done recently */}
        {done.length > 0 && (
          <div>
            <SectionHead eyebrow="Recently read" title="Finished" />
            <div className="read-later-list" style={{ marginTop: "1rem", opacity: 0.7 }}>
              {done.map(item => (
                <div key={item.id} className="rl-card">
                  <div className="rl-thumb" style={{ background: item.cover }} />
                  <div className="rl-body">
                    <div className="rl-title" style={{ textDecoration: "line-through", opacity: 0.7 }}>
                      {item.title}
                    </div>
                    <div className="rl-meta">
                      <span>{item.source}</span>
                      <span>Read {item.readAt ? fmt(item.readAt) : "recently"}</span>
                    </div>
                  </div>
                  <div className="rl-actions">
                    <button
                      className="btn btn-subtle btn-sm"
                      onClick={() => unmarkRead(item.id)}
                    >
                      Unmark
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card" style={{ padding: "1.25rem", background: "linear-gradient(135deg, #E8F5EE, #D4EDE1)", border: "1px solid rgba(0,105,62,0.15)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ fontSize: "1.5rem", lineHeight: 1 }}>💡</div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: "0.3rem" }}>How to use Read Later</p>
              <p className="small muted" style={{ lineHeight: 1.6 }}>
                Save articles, threads, and long reads here. They stay in a focused queue until you mark them done.
                The extension lets you clip anything from the web directly into this queue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
