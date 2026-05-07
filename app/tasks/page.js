"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Search, CheckCircle2, Clock, Circle, X, Trash2 } from "lucide-react";

export default function Tasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", projectId: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadAll();
  }, [status]);

  const loadAll = async () => {
    const [tasksRes, projectsRes, usersRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/projects"),
      fetch("/api/team"),
    ]);
    const [tasksData, projectsData, usersData] = await Promise.all([
      tasksRes.json(), projectsRes.json(), usersRes.json(),
    ]);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
    setProjects(Array.isArray(projectsData) ? projectsData : []);
    setUsers(Array.isArray(usersData) ? usersData : []);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) { setFormError("Task title is required"); return; }
    if (!form.projectId) { setFormError("Please select a project"); return; }

    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setFormError(data.error); return; }
    setForm({ title: "", description: "", projectId: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
    setShowCreate(false);
    loadAll();
  };

  const updateStatus = async (id, newStatus) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    loadAll();
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAll();
  };

  const filters = ["All", "TODO", "IN_PROGRESS", "COMPLETED"];
  const filterLabels = { All: "All", TODO: "Todo", IN_PROGRESS: "In Progress", COMPLETED: "Completed" };

  const filtered = tasks
    .filter((t) => filter === "All" || t.status === filter)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const statusIcon = (s) => {
    if (s === "COMPLETED") return <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />;
    if (s === "IN_PROGRESS") return <Clock size={16} style={{ color: 'var(--blue)' }} />;
    return <Circle size={16} style={{ color: 'var(--text-light)' }} />;
  };

  const badgeCls = (s) => {
    if (s === "COMPLETED") return "badge-green";
    if (s === "IN_PROGRESS") return "badge-blue";
    return "badge-gray";
  };

  const priorityColor = (p) => {
    if (p === "HIGH") return "var(--red)";
    if (p === "MEDIUM") return "var(--orange)";
    return "var(--green)";
  };

  if (loading) return <div style={{ padding: 40 }}><p className="text-muted">Loading tasks...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Track and manage all your assigned tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2" style={{ marginBottom: 24 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              background: filter === f ? 'var(--primary)' : 'white',
              color: filter === f ? 'white' : 'var(--text-muted)',
              border: filter === f ? 'none' : '1px solid var(--border)',
            }}
          >
            {filterLabels[f]}
            <span style={{
              background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--bg-main)',
              padding: '1px 8px', borderRadius: 20, fontSize: 12, marginLeft: 4,
            }}>
              {f === "All" ? tasks.length : tasks.filter((t) => t.status === f).length}
            </span>
          </button>
        ))}

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="input-field" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 240 }} />
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 32 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-dark)' }}>Create New Task</h2>
              <button onClick={() => { setShowCreate(false); setFormError(""); }} style={{ color: 'var(--text-light)' }}><X size={20} /></button>
            </div>

            {formError && (
              <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{formError}</div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="input-field" placeholder="e.g. Design the landing page" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows={2} placeholder="Optional details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Project *</label>
                  <select className="input-field" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">Select project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="input-field" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="input-field" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setFormError(""); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--text-light)', marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-dark)', marginBottom: 8 }}>No tasks found</h3>
          <p className="text-sm text-muted">
            {tasks.length === 0 ? "Create your first task to start tracking progress." : "No tasks match your current filters."}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const initials = task.assignee?.name?.split(" ").map(n => n[0]).join("") || "—";
                  return (
                    <tr key={task.id}>
                      <td>{statusIcon(task.status)}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{task.title}</td>
                      <td><span className="badge badge-gray">{task.project?.name || "—"}</span></td>
                      <td>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="avatar-sm" style={{ background: 'var(--primary)', marginLeft: 0 }}>{initials}</div>
                            <span>{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className="flex items-center">
                          <span className="priority-dot" style={{ background: priorityColor(task.priority) }}></span>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <select
                          className="input-field"
                          value={task.status}
                          onChange={(e) => updateStatus(task.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto', minWidth: 110 }}
                        >
                          <option value="TODO">Todo</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td>
                        {(session?.user?.role === "ADMIN") && (
                          <button onClick={() => deleteTask(task.id)} style={{ color: 'var(--text-light)' }} title="Delete"><Trash2 size={15} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
