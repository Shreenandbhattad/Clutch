import { useState, useDeferredValue } from "react";
import { intents } from "../data";
import type { Intent } from "../types";
import {
  useApp,
  TopBar, ItemCardGrid, ItemCardList, InspectorPanel, IntentBadge, fmt,
} from "./AppLayout";

type View = "grid" | "list";
type TimeFilter = "all" | "week" | "month";

const TIME_FILTERS = [
  { id: "all" as TimeFilter,   label: "All" },
  { id: "week" as TimeFilter,  label: "7 days" },
  { id: "month" as TimeFilter, label: "30 days" },
];

export default function Inbox() {
  const { items, selectedItemId, setSelectedItemId, showShare } = useApp();

  const [search, setSearch] = useState("");
  const [intentFilter, setIntentFilter] = useState<Intent | "All">("All");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [viewMode, setViewMode] = useState<View>("grid");

  const deferred = useDeferredValue(search);

  const filtered = items
    .filter(item => {
      if (!deferred.trim()) return true;
      return [item.title, item.source, item.summary, item.snippet, item.tags.join(" ")]
        .join(" ").toLowerCase().includes(deferred.toLowerCase());
    })
    .filter(item => intentFilter === "All" || item.intent === intentFilter)
    .filter(item => {
      const days = timeFilter === "week" ? 7 : timeFilter === "month" ? 30 : Infinity;
      return days === Infinity || Date.now() - new Date(item.createdAt).getTime() <= days * 864e5;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const shareUrl = (id: string, title: string) =>
    `${window.location.origin}/?share=item&id=${id}&title=${encodeURIComponent(title)}`;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <TopBar title="Inbox">
          {/* Search */}
          <div className="search-wrap" style={{ maxWidth: 280 }}>
            <span className="search-icon">⌕</span>
            <input
              className="input search-input"
              placeholder="Search your saves…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button
              className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewMode("grid")}
            >⊞</button>
            <button
              className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setViewMode("list")}
            >☰</button>
          </div>
        </TopBar>

        <div className="page">
          {/* Filters — single row */}
          <div className="filter-bar">
            {(["All", ...intents] as (Intent | "All")[]).map(intent => (
              <button
                key={intent}
                className={`filter-chip ${intentFilter === intent ? "active" : ""}`}
                onClick={() => setIntentFilter(intent)}
              >
                {intent}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.3rem", borderLeft: "1px solid var(--border-2)", paddingLeft: "0.6rem" }}>
              {TIME_FILTERS.map(f => (
                <button
                  key={f.id}
                  className={`filter-chip ${timeFilter === f.id ? "active" : ""}`}
                  onClick={() => setTimeFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="small muted">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
            {search.trim() ? ` matching "${search}"` : ""}
          </p>

          {/* Items */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◫</div>
              <h3>Nothing here yet</h3>
              <p>Save something from the dashboard or install the extension to clip from anywhere.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="items-grid">
              {filtered.map(item => (
                <ItemCardGrid
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  onShare={() => showShare(shareUrl(item.id, item.title), item.title)}
                />
              ))}
            </div>
          ) : (
            <div className="items-list">
              {filtered.map(item => (
                <ItemCardList
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  onShare={() => showShare(shareUrl(item.id, item.title), item.title)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inspector */}
      {selectedItemId && <InspectorPanel itemId={selectedItemId} />}
    </div>
  );
}
