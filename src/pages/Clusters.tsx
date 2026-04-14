import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from "react";
import { useNavigate } from "react-router-dom";
import type { Item } from "../types";
import { useApp, IntentBadge, fmt } from "./AppLayout";

// ─── Constants ───────────────────────────────────────────
const CARD_W  = 220;
const CARD_H  = 190; // approximate — varies with content

// Cluster anchor positions on the virtual canvas
const CLUSTER_ANCHORS: Record<string, { x: number; y: number }> = {
  "cluster-1": { x: 420,  y: 280 },
  "cluster-2": { x: 1180, y: 260 },
  "cluster-3": { x: 800,  y: 680 },
  "cluster-4": { x: 100,  y: 620 },
};
const FALLBACK_ANCHOR = { x: 1500, y: 450 };

// ─── Helpers ─────────────────────────────────────────────
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function computePositions(items: Item[]): Record<string, { x: number; y: number }> {
  const counts: Record<string, number> = {};
  const pos: Record<string, { x: number; y: number }> = {};
  items.forEach(item => {
    const anchor = CLUSTER_ANCHORS[item.clusterId] ?? FALLBACK_ANCHOR;
    const idx    = counts[item.clusterId] ?? 0;
    counts[item.clusterId] = idx + 1;
    const col    = idx % 2;
    const row    = Math.floor(idx / 2);
    const jitter = hashStr(item.id);
    pos[item.id] = {
      x: anchor.x + (col - 0.5) * (CARD_W + 28) + ((jitter % 24) - 12),
      y: anchor.y + row * (CARD_H + 24)           + (((jitter >> 4) % 24) - 12),
    };
  });
  return pos;
}

function getCenter(pos: { x: number; y: number }) {
  return { x: pos.x + CARD_W / 2, y: pos.y + CARD_H / 2 };
}

function buildConnections(items: Item[]) {
  const seen = new Set<string>();
  const list: { id: string; fromId: string; toId: string }[] = [];
  items.forEach(item => {
    item.relatedIds.forEach(relId => {
      if (!items.find(i => i.id === relId)) return;
      const key = [item.id, relId].sort().join("--");
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id: key, fromId: item.id, toId: relId });
      }
    });
  });
  return list;
}

function quadBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2 + (y2 - y1) * 0.25;
  const cy = (y1 + y2) / 2 - (x2 - x1) * 0.25;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// Float animation variables per card (deterministic from item id)
function floatVars(id: string) {
  const h = hashStr(id);
  const s = (n: number, range: number, bias = 0) => ((n % (range * 2)) - range + bias).toFixed(1);
  return {
    "--fx1": `${s(h,       6, 2)}px`,
    "--fy1": `${s(h >> 4,  5, -3)}px`,
    "--fx2": `${s(h >> 8,  5, -3)}px`,
    "--fy2": `${s(h >> 12, 6, 2)}px`,
    "--fx3": `${s(h >> 16, 4, 1)}px`,
    "--fy3": `${s(h >> 20, 5, -2)}px`,
    "--fx4": `${s(h >> 24, 4, -2)}px`,
    "--fy4": `${s(h >> 28, 4, 1)}px`,
    "--fr1": `${((h % 10) - 5) * 0.04}deg`,
    "--fr2": `${(((h >> 4) % 10) - 5) * 0.035}deg`,
    "--fr3": `${(((h >> 8) % 10) - 5) * 0.025}deg`,
    "--fr4": `${(((h >> 12) % 10) - 5) * 0.02}deg`,
    "--float-dur":   `${7 + (h % 6)}s`,
    "--float-delay": `${-(h % 9)}s`,
  } as React.CSSProperties;
}

// ─── Main component ───────────────────────────────────────
export default function Clusters() {
  const { items, clusters, pages, setPages, setSelectedItemId, showShare, toast } = useApp();
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement>(null);

  // Positions on virtual canvas
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => computePositions(items)
  );

  // Pan state
  const [pan, setPan] = useState({ x: -60, y: -60 });
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  // Dragging individual cards
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Selected item
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Build connection list
  const connections = useMemo(() => buildConnections(items), [items]);

  // ─── Global pointer handlers ──────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Canvas pan
      if (panRef.current && !dragRef.current) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        setPan({ x: panRef.current.panX + dx, y: panRef.current.panY + dy });
      }
      // Card drag
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPositions(prev => ({
          ...prev,
          [dragRef.current!.id]: {
            x: dragRef.current!.origX + dx,
            y: dragRef.current!.origY + dy,
          },
        }));
      }
    };

    const onUp = () => {
      panRef.current  = null;
      dragRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  const startCanvasPan = (e: RPE<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".canvas-item-card")) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const startCardDrag = (e: RPE<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    const pos = positions[id];
    if (!pos) return;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setDraggingId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    // Only treat as click if not dragged
    if (dragRef.current) return;
    setFocusedId(prev => prev === id ? null : id);
  };

  const handleOpenInInbox = (id: string) => {
    setSelectedItemId(id);
    navigate("/app/inbox");
  };

  const handleBuildPage = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return;
    const newPage = {
      id: `page-${crypto.randomUUID()}`,
      title: cluster.name,
      summary: `Built from the "${cluster.name}" cluster.`,
      linkedItemIds: cluster.itemIds,
      createdAt: new Date().toISOString(),
      pinned: true,
      blocks: [
        { id: `block-${crypto.randomUUID()}`, type: "heading" as const, content: cluster.name },
        { id: `block-${crypto.randomUUID()}`, type: "text"    as const, content: cluster.summary },
        ...cluster.itemIds.map(itemId => ({
          id: `block-${crypto.randomUUID()}`, type: "item" as const, itemId,
        })),
      ],
    };
    setPages([newPage, ...pages]);
    toast(`Page "${cluster.name}" created ✓`);
    navigate("/app/pages");
  };

  const shareUrl = (id: string, title: string) =>
    `${window.location.origin}/?share=item&id=${id}&title=${encodeURIComponent(title)}`;

  const focusedItem = focusedId ? items.find(i => i.id === focusedId) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Top bar */}
      <header className="topbar">
        <span className="topbar-title">Clusters</span>
        <div className="topbar-actions">
          <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>
            {items.length} articles · {clusters.filter(c => c.itemIds.length > 0).length} clusters
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPan({ x: -60, y: -60 })}>
            Reset view
          </button>
        </div>
      </header>

      {/* Canvas + optional detail panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── Infinite canvas ── */}
        <div
          ref={viewportRef}
          className="cluster-viewport"
          style={{ cursor: panRef.current ? "grabbing" : "grab" }}
          onPointerDown={startCanvasPan}
        >
          <div
            className="cluster-canvas"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            {/* ── SVG threads ── */}
            <svg
              className="cluster-threads"
              style={{ width: 3200, height: 2400, position: "absolute", top: 0, left: 0 }}
            >
              {connections.map(conn => {
                const fromPos = positions[conn.fromId];
                const toPos   = positions[conn.toId];
                if (!fromPos || !toPos) return null;
                const fc = getCenter(fromPos);
                const tc = getCenter(toPos);
                return (
                  <path
                    key={conn.id}
                    className="thread-line"
                    d={quadBezierPath(fc.x, fc.y, tc.x, tc.y)}
                  />
                );
              })}
            </svg>

            {/* ── Cluster region labels ── */}
            {clusters.filter(c => c.itemIds.length > 0).map(cluster => {
              const anchor = CLUSTER_ANCHORS[cluster.id] ?? FALLBACK_ANCHOR;
              return (
                <div
                  key={cluster.id}
                  className="cluster-label"
                  style={{ left: anchor.x - 16, top: anchor.y - 44 }}
                >
                  <div className="cluster-label-inner">
                    {cluster.name}
                    <span style={{ marginLeft: "0.5rem", opacity: 0.6, fontSize: "0.7rem" }}>
                      {cluster.itemIds.length} saves
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ── Article cards ── */}
            {items.map(item => {
              const pos = positions[item.id];
              if (!pos) return null;
              const isFocused  = focusedId === item.id;
              const isDragging = draggingId === item.id;
              const vars = floatVars(item.id);

              return (
                <CanvasCard
                  key={item.id}
                  item={item}
                  pos={pos}
                  vars={vars}
                  isFocused={isFocused}
                  isDragging={isDragging}
                  onPointerDown={e => startCardDrag(e, item.id)}
                  onClick={e => handleCardClick(e, item.id)}
                  onOpen={() => handleOpenInInbox(item.id)}
                  onShare={() => showShare(shareUrl(item.id, item.title), item.title)}
                  onBuildPage={() => handleBuildPage(item.clusterId)}
                />
              );
            })}
          </div>

          {/* Hint */}
          <div className="canvas-hint">
            Drag to pan · Drag cards to rearrange · Click a card to inspect
          </div>

          {/* Edge vignette is via ::after in CSS */}
        </div>

        {/* ── Detail side panel (when card is focused) ── */}
        {focusedItem && (
          <ClusterDetailPanel
            item={focusedItem}
            cluster={clusters.find(c => c.id === focusedItem.clusterId)}
            onClose={() => setFocusedId(null)}
            onOpen={() => handleOpenInInbox(focusedItem.id)}
            onBuildPage={() => handleBuildPage(focusedItem.clusterId)}
            onShare={() => showShare(shareUrl(focusedItem.id, focusedItem.title), focusedItem.title)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Canvas card ─────────────────────────────────────────
function CanvasCard({
  item, pos, vars, isFocused, isDragging,
  onPointerDown, onClick, onOpen, onShare, onBuildPage,
}: {
  item: Item;
  pos: { x: number; y: number };
  vars: React.CSSProperties;
  isFocused: boolean;
  isDragging: boolean;
  onPointerDown: (e: RPE<HTMLDivElement>) => void;
  onClick: (e: React.MouseEvent) => void;
  onOpen: () => void;
  onShare: () => void;
  onBuildPage: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className={`canvas-item-card ${isDragging ? "is-dragging" : ""}`}
      style={{
        left: pos.x,
        top:  pos.y,
        outline: isFocused ? "2px solid rgba(0,105,62,0.55)" : undefined,
        zIndex: isFocused ? 15 : isDragging ? 20 : undefined,
        ...vars,
      }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {/* Cover */}
      {item.imageUrl && !imgErr ? (
        <img
          src={item.imageUrl}
          alt=""
          className="canvas-item-cover-img"
          onError={() => setImgErr(true)}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="canvas-item-cover-grad" style={{ background: item.cover }} />
      )}

      {/* Body */}
      <div className="canvas-item-body">
        <div className="canvas-item-source">{item.source}</div>
        <div className="canvas-item-title">{item.title}</div>
        <div className="canvas-item-desc">{item.snippet}</div>
      </div>

      {/* Footer */}
      <div className="canvas-item-footer">
        <IntentBadge intent={item.intent} />
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.25rem" }}>
          <button
            className="btn btn-subtle btn-sm btn-icon"
            title="Share"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onShare(); }}
          >↑</button>
          <button
            className="btn btn-primary btn-sm btn-icon"
            title="Open in inbox"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onOpen(); }}
          >→</button>
        </div>
      </div>
    </div>
  );
}

// ─── Cluster detail panel (slide-in right) ───────────────
function ClusterDetailPanel({
  item, cluster, onClose, onOpen, onBuildPage, onShare,
}: {
  item: Item;
  cluster: ReturnType<typeof useApp>["clusters"][0] | undefined;
  onClose: () => void;
  onOpen: () => void;
  onBuildPage: () => void;
  onShare: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <aside style={{
      width: 300,
      minWidth: 300,
      borderLeft: "1px solid var(--border)",
      background: "var(--surface)",
      overflowY: "auto",
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Close */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="section-eyebrow">Article detail</p>
        <button className="btn btn-subtle btn-sm btn-icon" onClick={onClose}>×</button>
      </div>

      {/* Cover */}
      {item.imageUrl && !imgErr ? (
        <img
          src={item.imageUrl}
          alt=""
          style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: "var(--r-lg)" }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div style={{ width: "100%", height: 140, background: item.cover, borderRadius: "var(--r-lg)" }} />
      )}

      {/* Info */}
      <div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <span className="badge">{item.source}</span>
          <IntentBadge intent={item.intent} />
          {cluster && <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}>{cluster.name}</span>}
        </div>
        <h3 style={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.35, marginBottom: "0.4rem" }}>{item.title}</h3>
        <p className="small muted" style={{ lineHeight: 1.55 }}>{item.snippet}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="item-url-link"
          style={{ marginTop: "0.4rem", display: "block" }}
        >
          {item.url.length > 40 ? item.url.slice(0, 40) + "…" : item.url}
        </a>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <button className="btn btn-primary full-width" onClick={onOpen}>Open in Inbox →</button>
        <button className="btn btn-ghost full-width" onClick={onShare}>↑ Share article</button>
        {cluster && (
          <button className="btn btn-subtle full-width" onClick={onBuildPage}>
            ◻ Build page from "{cluster.name}"
          </button>
        )}
      </div>

      {/* Tags */}
      <div>
        <p className="section-eyebrow" style={{ marginBottom: "0.5rem" }}>Tags</p>
        <div className="tags">
          {item.tags.map(t => <span key={t} className="badge">{t}</span>)}
        </div>
      </div>

      {/* Cluster info */}
      {cluster && (
        <div className="ai-card">
          <div className="ai-card-head">
            <span className="ai-badge">AI</span>
            <span className="small bold">Cluster: {cluster.name}</span>
          </div>
          <p className="small muted" style={{ lineHeight: 1.55 }}>{cluster.summary}</p>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {cluster.relatedThemes.map(t => <span key={t} className="badge">{t}</span>)}
          </div>
        </div>
      )}
    </aside>
  );
}
