"use client";

import { useEffect, useState, useRef } from "react";

const COLORS = {
  bg: "#0f0f11",
  surface: "#17171a",
  border: "#2a2a2f",
  accent: "#e8c87a",
  accentDim: "#e8c87a22",
  text: "#f0ede8",
  muted: "#6b6870",
  danger: "#e87a7a",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    if (modalOpen) setTimeout(() => titleRef.current?.focus(), 80);
  }, [modalOpen]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDocs = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok) setDocuments(data.documents || []);
      else showToast(data.error || "Failed to load", "error");
    } catch {
      showToast("Network error", "error");
    } finally {
      setFetching(false);
    }
  };

  const openNew = () => {
    setEditDoc(null);
    setForm({ title: "", content: "", tags: "" });
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({
      title: doc.title,
      content: doc.content,
      tags: (doc.tags || []).join(", "),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditDoc(null);
  };

  const saveDoc = async () => {
    if (!form.title.trim()) return showToast("Title is required", "error");
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const res = await fetch(
        editDoc ? `/api/documents/${editDoc._id}` : "/api/documents",
        {
          method: editDoc ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchDocs();
        closeModal();
        showToast(editDoc ? "Document updated" : "Document created");
      } else {
        showToast(data.error || "Save failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteDoc = async (id) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((d) => d.filter((x) => x._id !== id));
        showToast("Document deleted");
      } else {
        showToast("Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content?.toLowerCase().includes(search.toLowerCase()) ||
      (d.tags || []).some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      )
  );

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div style={styles.page}>
      <div style={styles.grain} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.logo}>Vault</div>
            <div style={styles.subtext}>
              <span style={styles.count}>{documents.length} documents</span>
            </div>
          </div>
          <button style={styles.newBtn} onClick={openNew}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Document
          </button>
        </div>
      </header>

      {/* Search */}
      <div style={styles.searchWrap}>
        <input
          style={styles.searchInput}
          placeholder="Search by title, content, or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <main style={styles.main}>
        {fetching ? (
          <div style={styles.emptyState}>
            <div style={styles.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📄</div>
            <p style={styles.emptyText}>
              {search ? "No matching documents" : "No documents yet"}
            </p>
            {!search && (
              <button style={styles.emptyBtn} onClick={openNew}>
                Create your first document
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((doc) => (
              <div key={doc._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <h3 style={styles.cardTitle}>{doc.title}</h3>
                  <div style={styles.cardActions}>
                    <button
                      style={styles.iconBtn}
                      title="Edit"
                      onClick={() => openEdit(doc)}
                    >
                      ✎
                    </button>
                    <button
                      style={{ ...styles.iconBtn, color: COLORS.danger }}
                      title="Delete"
                      onClick={() => setDeleteConfirm(doc._id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {doc.content && (
                  <p style={styles.cardContent}>
                    {doc.content.slice(0, 140)}
                    {doc.content.length > 140 ? "…" : ""}
                  </p>
                )}
                {(doc.tags || []).length > 0 && (
                  <div style={styles.tags}>
                    {doc.tags.map((t) => (
                      <span key={t} style={styles.tag}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div style={styles.cardDate}>{formatDate(doc.updatedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>
                {editDoc ? "Edit Document" : "New Document"}
              </span>
              <button style={styles.closeBtn} onClick={closeModal}>
                ✕
              </button>
            </div>
            <input
              ref={titleRef}
              style={styles.input}
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && saveDoc()}
            />
            <textarea
              style={styles.textarea}
              placeholder="Content (optional)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={7}
            />
            <input
              style={styles.input}
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={closeModal}>
                Cancel
              </button>
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
                onClick={saveDoc}
                disabled={saving}
              >
                {saving ? "Saving…" : editDoc ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <p style={styles.confirmText}>Delete this document?</p>
            <div style={styles.confirmBtns}>
              <button
                style={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.saveBtn, background: COLORS.danger }}
                onClick={() => deleteDoc(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "error" ? COLORS.danger : COLORS.accent,
            color: toast.type === "error" ? "#fff" : "#0f0f11",
          }}
        >
          {toast.msg}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::placeholder { color: ${COLORS.muted}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  grain: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
    backgroundSize: "200px",
    opacity: 0.6,
  },
  header: {
    position: "relative",
    zIndex: 1,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: "0 24px",
  },
  headerInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "20px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    color: COLORS.accent,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  subtext: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  count: { color: COLORS.accent },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: COLORS.accent,
    color: "#0f0f11",
    border: "none",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  searchWrap: {
    position: "relative",
    zIndex: 1,
    maxWidth: 960,
    margin: "28px auto 0",
    padding: "0 24px",
  },
  searchInput: {
    width: "100%",
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.text,
    padding: "11px 16px",
    fontSize: 14,
    outline: "none",
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 960,
    margin: "28px auto 60px",
    padding: "0 24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    animation: "fadeUp .3s ease both",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.4,
    color: COLORS.text,
    flex: 1,
  },
  cardActions: { display: "flex", gap: 6, flexShrink: 0 },
  iconBtn: {
    background: "none",
    border: "none",
    color: COLORS.muted,
    cursor: "pointer",
    fontSize: 15,
    padding: "2px 4px",
    borderRadius: 4,
  },
  cardContent: { margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 },
  tags: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: {
    background: COLORS.accentDim,
    color: COLORS.accent,
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 500,
  },
  cardDate: { fontSize: 11, color: COLORS.muted, marginTop: "auto", paddingTop: 4 },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 320,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: COLORS.muted, fontSize: 14, margin: 0 },
  emptyBtn: {
    background: COLORS.accentDim,
    color: COLORS.accent,
    border: `1px solid ${COLORS.accent}44`,
    borderRadius: 8,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 4,
  },
  spinner: {
    width: 28,
    height: 28,
    border: `2px solid ${COLORS.border}`,
    borderTopColor: COLORS.accent,
    borderRadius: "50%",
    animation: "spin .7s linear infinite",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.65)",
    backdropFilter: "blur(4px)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    width: "100%",
    maxWidth: 520,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    animation: "fadeUp .2s ease",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontWeight: 600, fontSize: 16, color: COLORS.text },
  closeBtn: {
    background: "none",
    border: "none",
    color: COLORS.muted,
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
  },
  input: {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.text,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
  },
  textarea: {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.text,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.6,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    background: "none",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.muted,
    padding: "9px 18px",
    fontSize: 13,
    cursor: "pointer",
  },
  saveBtn: {
    background: COLORS.accent,
    border: "none",
    borderRadius: 8,
    color: "#0f0f11",
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  confirmBox: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: "28px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    animation: "fadeUp .2s ease",
  },
  confirmText: { margin: 0, fontSize: 15, color: COLORS.text, textAlign: "center" },
  confirmBtns: { display: "flex", gap: 10, justifyContent: "center" },
  toast: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 500,
    zIndex: 100,
    animation: "fadeUp .25s ease",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 20px rgba(0,0,0,.4)",
  },
};