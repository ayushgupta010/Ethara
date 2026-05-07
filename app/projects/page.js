"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, Trash2, X, FolderKanban, ArrowRight } from "lucide-react";

export default function Projects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadProjects();
  }, [status]);

  const loadProjects = async () => {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) { setFormError("Project name is required"); return; }

    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setFormError(data.error); return; }
    setForm({ name: "", description: "" });
    setShowCreate(false);
    loadProjects();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent navigating to detail page
    if (!confirm("Delete this project and all its tasks?")) return;
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadProjects();
  };

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => filterStatus === "ALL" || p.status === filterStatus);

  const colors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#0284c7", "#7c3aed"];

  const statusBadge = {
    ACTIVE: { label: "Active", bg: "var(--green-bg)", color: "var(--green)" },
    ON_HOLD: { label: "On Hold", bg: "#fff7ed", color: "var(--orange)" },
    COMPLETED: { label: "Completed", bg: "var(--blue-bg)", color: "var(--blue)" },
  };

  const counts = {
    ALL: projects.length,
    ACTIVE: projects.filter((p) => p.status === "ACTIVE").length,
    ON_HOLD: projects.filter((p) => p.status === "ON_HOLD").length,
    COMPLETED: projects.filter((p) => p.status === "COMPLETED").length,
  };

  if (loading) return <div style={{ padding: 40 }}><p className="text-muted">Loading projects...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track all team projects</p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filters + Search row */}
      <div className="flex items-center gap-3" style={{ marginBottom: 24, flexWrap: "wrap" }}>
        {["ALL", "ACTIVE", "ON_HOLD", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="btn"
            style={{
              background: filterStatus === s ? "var(--primary)" : "white",
              color: filterStatus === s ? "white" : "var(--text-muted)",
              border: filterStatus === s ? "none" : "1px solid var(--border)",
              fontSize: 13,
            }}
          >
            {s === "ALL" ? "All" : s === "ON_HOLD" ? "On Hold" : s.charAt(0) + s.slice(1).toLowerCase()}
            <span style={{
              background: filterStatus === s ? "rgba(255,255,255,0.2)" : "var(--bg-main)",
              padding: "1px 7px", borderRadius: 20, fontSize: 11, marginLeft: 4,
            }}>
              {counts[s]}
            </span>
          </button>
        ))}

        <div className="card flex items-center" style={{ padding: "8px 14px", marginLeft: "auto", marginBottom: 0 }}>
          <Search size={15} style={{ color: "var(--text-light)", marginRight: 8 }} />
          <input
            className="input-field"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", boxShadow: "none", padding: "2px 0", background: "transparent", width: 200 }}
          />
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: 32 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-dark)" }}>Create New Project</h2>
              <button onClick={() => { setShowCreate(false); setFormError(""); }} style={{ color: "var(--text-light)" }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: "var(--red-bg)", color: "var(--red)", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="input-field" placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows={3} placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
              </div>
              <div className="flex gap-3" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setFormError(""); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <FolderKanban size={48} style={{ color: "var(--text-light)", margin: "0 auto 16px", display: "block" }} />
          <h3 style={{ color: "var(--text-dark)", marginBottom: 8 }}>
            {projects.length === 0 ? "No projects yet" : "No matching projects"}
          </h3>
          <p className="text-sm text-muted">
            {session?.user?.role === "ADMIN"
              ? "Create your first project to get started."
              : "Ask an admin to add you to a project."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map((project, idx) => {
            const color = colors[idx % colors.length];
            const memberNames = project.members?.map((m) =>
              m.user?.name?.split(" ").map((n) => n[0]).join("")
            ).filter(Boolean) || [];
            const badge = statusBadge[project.status] || statusBadge.ACTIVE;

            return (
              <div
                key={project.id}
                className="card"
                style={{ padding: 24, cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s" }}
                onClick={() => router.push(`/projects/${project.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
              >
                {/* Header */}
                <div className="flex justify-between items-start" style={{ marginBottom: 14 }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color }}>
                      <Users size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-dark)", fontSize: 15 }}>{project.name}</div>
                      <div className="text-xs text-muted">by {project.owner?.name || "Unknown"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
                      {badge.label}
                    </span>
                    {(session?.user?.role === "ADMIN" || project.ownerId === session?.user?.id) && (
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        style={{ color: "var(--text-light)" }}
                        title="Delete project"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-muted" style={{ marginBottom: 14, lineHeight: 1.5 }}>
                    {project.description.length > 80 ? project.description.slice(0, 80) + "…" : project.description}
                  </p>
                )}

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                  <div className="flex justify-between text-xs" style={{ marginBottom: 6 }}>
                    <span className="text-muted">Progress</span>
                    <span style={{ fontWeight: 600, color: "var(--text-dark)" }}>{project.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.progress || 0}%`, background: color }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center" style={{ paddingTop: 12, borderTop: "1px solid var(--border-light)" }}>
                  <div className="avatar-group">
                    {memberNames.slice(0, 3).map((m, i) => (
                      <div key={i} className="avatar-sm" style={{ background: colors[(idx + i + 1) % colors.length] }}>{m}</div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{project.completedCount || 0}/{project.taskCount || 0} tasks</span>
                    <ArrowRight size={14} style={{ color: "var(--text-light)" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
