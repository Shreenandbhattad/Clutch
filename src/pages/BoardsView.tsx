import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Board, BoardElement } from "../types";
import { useApp, TopBar, SectionHead } from "./AppLayout";

type DragState = {
  boardId: string;
  elementId: string;
  offsetX: number;
  offsetY: number;
  canvasLeft: number;
  canvasTop: number;
} | null;

const BOARD_TONES = [
  { id: "cloud" as const, label: "Cloud" },
  { id: "linen" as const, label: "Linen" },
  { id: "slate" as const, label: "Slate" },
];

export default function BoardsView() {
  const { items, boards, setBoards, setSelectedItemId, toast } = useApp();
  const [activeBoardId, setActiveBoardId] = useState(boards[0]?.id ?? "");
  const [dragState, setDragState] = useState<DragState>(null);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteEditText, setNoteEditText] = useState("");

  const activeBoard = boards.find(b => b.id === activeBoardId);

  // Pointer drag handlers
  useEffect(() => {
    if (!dragState) return;
    const handleMove = (e: PointerEvent) => {
      setBoards(boards.map(board =>
        board.id !== dragState.boardId ? board : {
          ...board,
          elements: board.elements.map(el =>
            el.id !== dragState.elementId ? el : {
              ...el,
              x: Math.max(12, e.clientX - dragState.canvasLeft - dragState.offsetX),
              y: Math.max(12, e.clientY - dragState.canvasTop - dragState.offsetY),
            }
          ),
        }
      ));
    };
    const handleUp = () => setDragState(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState, boards, setBoards]);

  const startDrag = (boardId: string, elementId: string, e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!canvasRect) return;
    setDragState({
      boardId,
      elementId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      canvasLeft: canvasRect.left,
      canvasTop: canvasRect.top,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const addNote = () => {
    if (!activeBoard) return;
    setBoards(boards.map(b =>
      b.id !== activeBoard.id ? b : {
        ...b,
        elements: [...b.elements, {
          id: `el-${crypto.randomUUID()}`,
          type: "note",
          note: "New thought…",
          x: 60 + Math.random() * 200,
          y: 60 + Math.random() * 200,
          width: 220,
          height: 130,
        }],
      }
    ));
    toast("Note added to board");
  };

  const addSelectedItem = () => {
    const item = items[0];
    if (!activeBoard || !item) return;
    setBoards(boards.map(b =>
      b.id !== activeBoard.id ? b : {
        ...b,
        elements: [...b.elements, {
          id: `el-${crypto.randomUUID()}`,
          type: "item",
          itemId: item.id,
          x: 80 + Math.random() * 200,
          y: 80 + Math.random() * 200,
          width: 240,
          height: 170,
        }],
      }
    ));
    toast("Item added to board");
  };

  const removeElement = (boardId: string, elementId: string) => {
    setBoards(boards.map(b =>
      b.id !== boardId ? b : { ...b, elements: b.elements.filter(e => e.id !== elementId) }
    ));
  };

  const setTone = (tone: Board["tone"]) => {
    if (!activeBoard) return;
    setBoards(boards.map(b => b.id === activeBoard.id ? { ...b, tone } : b));
  };

  const saveNoteEdit = () => {
    if (!noteEditId || !activeBoard) return;
    setBoards(boards.map(b =>
      b.id !== activeBoard.id ? b : {
        ...b,
        elements: b.elements.map(el =>
          el.id !== noteEditId || el.type !== "note" ? el : { ...el, note: noteEditText }
        ),
      }
    ));
    setNoteEditId(null);
  };

  return (
    <>
      <TopBar title={activeBoard?.title ?? "Boards"}>
        <div className="topbar-actions">
          {/* Board selector */}
          {boards.length > 1 && (
            <select
              className="input"
              style={{ width: "auto", padding: "0.4rem 0.75rem" }}
              value={activeBoardId}
              onChange={e => setActiveBoardId(e.target.value)}
            >
              {boards.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          )}
          {/* Tone picker */}
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {BOARD_TONES.map(t => (
              <button
                key={t.id}
                className={`filter-chip ${activeBoard?.tone === t.id ? "active" : ""}`}
                onClick={() => setTone(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={addSelectedItem}>+ Add item</button>
          <button className="btn btn-primary btn-sm" onClick={addNote}>+ Note</button>
        </div>
      </TopBar>

      <div className="page">
        {!activeBoard ? (
          <div className="empty-state">
            <div className="empty-icon">⊞</div>
            <h3>No boards yet</h3>
            <p>Boards let you arrange your saves spatially to find connections.</p>
          </div>
        ) : (
          <div className={`board-canvas tone-${activeBoard.tone}`}>
            {activeBoard.elements.map(element => (
              <BoardElementView
                key={element.id}
                element={element}
                items={items}
                boardId={activeBoard.id}
                isEditingNote={noteEditId === element.id}
                noteEditText={noteEditText}
                onStartDrag={(e) => startDrag(activeBoard.id, element.id, e)}
                onOpenItem={(id) => { setSelectedItemId(id); }}
                onRemove={() => removeElement(activeBoard.id, element.id)}
                onStartEdit={(note) => { setNoteEditId(element.id); setNoteEditText(note); }}
                onNoteChange={setNoteEditText}
                onSaveNote={saveNoteEdit}
                onCancelEdit={() => setNoteEditId(null)}
              />
            ))}

            {activeBoard.elements.length === 0 && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column", gap: "0.75rem",
                color: "var(--text-4)", textAlign: "center",
              }}>
                <div style={{ fontSize: "2.5rem", opacity: 0.4 }}>⊞</div>
                <p style={{ fontWeight: 600 }}>This board is empty</p>
                <p className="small">Add notes or items from the toolbar above</p>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="ai-card">
          <div className="ai-card-head">
            <span className="ai-badge">TIP</span>
            <span className="small bold">Using boards</span>
          </div>
          <p className="small muted" style={{ lineHeight: 1.65 }}>
            Boards are spatial thinking surfaces. Drag cards around to find connections between your saves.
            Add sticky notes to jot down insights. Switch between Cloud, Linen, and Slate tones to match your mood.
            Double-click a note to edit it.
          </p>
        </div>
      </div>
    </>
  );
}

function BoardElementView({
  element, items, boardId, isEditingNote, noteEditText,
  onStartDrag, onOpenItem, onRemove, onStartEdit, onNoteChange, onSaveNote, onCancelEdit,
}: {
  element: BoardElement;
  items: ReturnType<typeof useApp>["items"];
  boardId: string;
  isEditingNote: boolean;
  noteEditText: string;
  onStartDrag: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onOpenItem: (id: string) => void;
  onRemove: () => void;
  onStartEdit: (note: string) => void;
  onNoteChange: (v: string) => void;
  onSaveNote: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <div
      className="board-element"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
      onPointerDown={onStartDrag}
    >
      {/* Remove button */}
      <button
        className="btn btn-sm"
        style={{
          position: "absolute", top: 4, right: 4, padding: "0 4px",
          background: "rgba(0,0,0,0.06)", borderRadius: 4, fontSize: "0.7rem", zIndex: 2,
          color: "var(--text-4)", lineHeight: 1.6,
        }}
        onPointerDown={e => e.stopPropagation()}
        onClick={onRemove}
      >
        ×
      </button>

      {element.type === "item" ? (
        <ItemBoardCard
          item={items.find(i => i.id === element.itemId)}
          onOpen={() => element.type === "item" && onOpenItem(element.itemId)}
        />
      ) : isEditingNote ? (
        <div className="board-note-body" onPointerDown={e => e.stopPropagation()}>
          <textarea
            className="input"
            style={{ flex: 1, resize: "none", fontSize: "0.88rem" }}
            value={noteEditText}
            onChange={e => onNoteChange(e.target.value)}
            autoFocus
          />
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button className="btn btn-primary btn-sm" onClick={onSaveNote}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={onCancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        <div
          className="board-note-body"
          onDoubleClick={() => element.type === "note" && onStartEdit(element.note)}
          title="Double-click to edit"
        >
          <span className="eyebrow">Note</span>
          <p>{element.type === "note" ? element.note : ""}</p>
        </div>
      )}
    </div>
  );
}

function ItemBoardCard({ item, onOpen }: { item: ReturnType<typeof useApp>["items"][0] | undefined; onOpen: () => void }) {
  if (!item) return <div style={{ padding: "0.75rem", color: "var(--text-4)", fontSize: "0.82rem" }}>Item not found</div>;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 70, background: item.cover, borderRadius: "var(--r-md)" }} />
      <div style={{ flex: 1, padding: "0.6rem 0 0" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {item.source}
        </div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.3, marginTop: "0.15rem" }}>
          {item.title.length > 60 ? item.title.slice(0, 60) + "…" : item.title}
        </div>
      </div>
      <button
        className="btn btn-ghost btn-sm full-width"
        style={{ marginTop: "0.35rem", justifyContent: "center", fontSize: "0.75rem" }}
        onPointerDown={e => e.stopPropagation()}
        onClick={onOpen}
      >
        View →
      </button>
    </div>
  );
}
