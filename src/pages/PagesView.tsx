import { useState } from "react";
import type { Page, PageBlock, Item } from "../types";
import { useApp, TopBar, SectionHead, fmt, IntentBadge } from "./AppLayout";

export default function PagesView() {
  const { items, pages, setPages, selectedItemId, showShare, toast } = useApp();
  const [selectedId, setSelectedId] = useState(pages[0]?.id ?? "");
  const [textDraft, setTextDraft] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const selected = pages.find(p => p.id === selectedId);

  const createPage = () => {
    const selectedItem = items.find(i => i.id === selectedItemId);
    const newPage: Page = {
      id: `page-${crypto.randomUUID()}`,
      title: "New page",
      summary: "A blank canvas for your thinking.",
      linkedItemIds: selectedItem ? [selectedItem.id] : [],
      createdAt: new Date().toISOString(),
      pinned: false,
      blocks: [
        { id: `block-${crypto.randomUUID()}`, type: "heading", content: "Start here…" } as PageBlock,
        ...(selectedItem
          ? [{ id: `block-${crypto.randomUUID()}`, type: "item", itemId: selectedItem.id } as PageBlock]
          : []),
      ],
    };
    setPages([newPage, ...pages]);
    setSelectedId(newPage.id);
    toast("New page created");
  };

  const deletePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
    setSelectedId(pages.find(p => p.id !== id)?.id ?? "");
    toast("Page deleted");
  };

  const togglePin = (id: string) => {
    setPages(pages.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  };

  const addTextBlock = () => {
    if (!selected || !textDraft.trim()) return;
    setPages(pages.map(p =>
      p.id !== selected.id ? p : {
        ...p,
        blocks: [...p.blocks, { id: `block-${crypto.randomUUID()}`, type: "text", content: textDraft.trim() } as PageBlock],
      }
    ));
    setTextDraft("");
  };

  const linkItem = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!selected || !item || selected.linkedItemIds.includes(item.id)) {
      toast("Item already linked or none selected");
      return;
    }
    setPages(pages.map(p =>
      p.id !== selected.id ? p : {
        ...p,
        linkedItemIds: [...p.linkedItemIds, item.id],
        blocks: [...p.blocks, { id: `block-${crypto.randomUUID()}`, type: "item", itemId: item.id } as PageBlock],
      }
    ));
    toast("Item linked to page ✓");
  };

  const saveTitle = () => {
    if (!selected || !titleDraft.trim()) return;
    setPages(pages.map(p => p.id === selected.id ? { ...p, title: titleDraft.trim() } : p));
    setEditingTitle(false);
    toast("Page renamed ✓");
  };

  const shareUrl = (id: string, title: string) =>
    `${window.location.origin}/?share=page&id=${id}&title=${encodeURIComponent(title)}`;

  return (
    <>
      <TopBar title="Pages">
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={linkItem}>
            + Link selected item
          </button>
          <button className="btn btn-primary btn-sm" onClick={createPage}>
            + New page
          </button>
        </div>
      </TopBar>

      <div className="page" style={{ flex: 1 }}>
        <div className="pages-layout">
          {/* Page list */}
          <div className="pages-list-panel">
            <p className="section-eyebrow" style={{ marginBottom: "0.6rem" }}>
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </p>
            {pages.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <div className="empty-icon">◻</div>
                <h3>No pages yet</h3>
                <p>Create a page to organize your saves into structured notes.</p>
              </div>
            ) : (
              pages
                .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || +new Date(b.createdAt) - +new Date(a.createdAt))
                .map(page => (
                  <div
                    key={page.id}
                    className={`page-list-item ${selectedId === page.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(page.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                      <h4>{page.pinned ? "★ " : ""}{page.title}</h4>
                      <span className="badge">{page.blocks.length} blocks</span>
                    </div>
                    <p>{page.summary}</p>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-4)", marginTop: "0.35rem" }}>
                      {fmt(page.createdAt)} · {page.linkedItemIds.length} links
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Page editor */}
          {selected ? (
            <div className="page-editor">
              {/* Title */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                {editingTitle ? (
                  <div style={{ flex: 1, display: "flex", gap: "0.5rem" }}>
                    <input
                      className="input page-editor-title"
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveTitle()}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={saveTitle}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingTitle(false)}>Cancel</button>
                  </div>
                ) : (
                  <h1
                    className="page-editor-title"
                    style={{ flex: 1, cursor: "pointer" }}
                    onClick={() => { setTitleDraft(selected.title); setEditingTitle(true); }}
                    title="Click to rename"
                  >
                    {selected.title}
                  </h1>
                )}
                {/* Actions */}
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, paddingTop: "0.2rem" }}>
                  <button
                    className="btn btn-subtle btn-sm btn-icon"
                    title="Pin/unpin"
                    onClick={() => togglePin(selected.id)}
                  >
                    {selected.pinned ? "★" : "☆"}
                  </button>
                  <button
                    className="btn btn-subtle btn-sm btn-icon"
                    title="Share page"
                    onClick={() => showShare(shareUrl(selected.id, selected.title), selected.title)}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    title="Delete page"
                    onClick={() => deletePage(selected.id)}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Summary + meta */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span className="badge">{fmt(selected.createdAt)}</span>
                <span className="badge">{selected.linkedItemIds.length} items linked</span>
                {selected.pinned && <span className="badge badge-amber">Pinned</span>}
              </div>

              {/* Blocks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                {selected.blocks.map(block => (
                  <PageBlockView key={block.id} block={block} items={items} />
                ))}
              </div>

              {/* Add text block */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <label className="input-label">Add a note or section</label>
                <textarea
                  className="input"
                  rows={3}
                  value={textDraft}
                  onChange={e => setTextDraft(e.target.value)}
                  placeholder="Write a note, observation, or next step…"
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "0.5rem" }}
                  onClick={addTextBlock}
                  disabled={!textDraft.trim()}
                >
                  + Add block
                </button>
              </div>
            </div>
          ) : (
            <div className="page-editor">
              <div className="empty-state" style={{ flex: 1 }}>
                <div className="empty-icon">◻</div>
                <h3>No page selected</h3>
                <p>Select a page from the list or create a new one.</p>
                <button className="btn btn-primary" onClick={createPage}>+ New page</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PageBlockView({ block, items }: { block: PageBlock; items: Item[] }) {
  if (block.type === "heading") {
    return (
      <div className="page-block page-block-heading">
        <h4>{block.content}</h4>
      </div>
    );
  }
  if (block.type === "text") {
    return (
      <div className="page-block page-block-text">
        <p>{block.content}</p>
      </div>
    );
  }
  if (block.type === "note") {
    return (
      <div className="page-block page-block-note">
        <p>{block.content}</p>
      </div>
    );
  }
  if (block.type === "item") {
    const item = items.find(i => i.id === block.itemId);
    if (!item) return <div className="page-block"><p className="muted small">Linked item unavailable.</p></div>;
    return (
      <div className="page-block" style={{ display: "flex", alignItems: "center", gap: "0.9rem", background: "var(--surface)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "var(--r-md)", background: item.cover, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.source}</div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.3, marginTop: "0.15rem" }}>{item.title}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-3)", marginTop: "0.2rem" }}>{item.snippet?.slice(0, 100)}…</div>
        </div>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">↗</a>
      </div>
    );
  }
  return null;
}
