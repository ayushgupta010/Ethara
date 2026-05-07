"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ListTodo,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div style={{ padding: 40 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentTasks = data?.recentTasks || [];
  const projects = data?.projects || [];

  const statCards = [
    { label: "Total Projects", value: stats.totalProjects || 0, icon: FolderKanban, iconBg: "var(--primary-light)", iconColor: "var(--primary)" },
    { label: "Tasks In Progress", value: stats.inProgressTasks || 0, icon: Clock, iconBg: "var(--blue-bg)", iconColor: "var(--blue)" },
    { label: "Completed", value: stats.completedTasks || 0, icon: CheckCircle2, iconBg: "var(--green-bg)", iconColor: "var(--green)" },
    { label: "Overdue", value: stats.overdueTasks || 0, icon: AlertTriangle, iconBg: "var(--red-bg)", iconColor: "var(--red)" },
  ];

  const statusBadge = (s) => {
    if (s === "COMPLETED") return { cls: "badge-green", label: "Done" };
    if (s === "IN_PROGRESS") return { cls: "badge-blue", label: "In Progress" };
    return { cls: "badge-gray", label: "Todo" };
  };

  const priorityColor = (p) => {
    if (p === "HIGH") return "var(--red)";
    if (p === "MEDIUM") return "var(--orange)";
    return "var(--green)";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {session?.user?.name || "User"}. Here is your workspace overview.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card stat-card">
              <div className="stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                <Icon size={20} />
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {recentTasks.length === 0 && projects.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <ListTodo size={48} style={{ color: 'var(--text-light)', marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text-dark)', marginBottom: 8 }}>No data yet</h3>
          <p className="text-sm text-muted">
            Create your first project and start adding tasks to see your dashboard come to life.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.push("/projects")}>
            Go to Projects
          </button>
        </div>
      ) : (
        <div className="grid-2-1">
          {/* Recent Tasks */}
          <div className="card" style={{ padding: 0 }}>
            <div className="card-header">
              <span className="card-title">Recent Tasks</span>
              <button className="btn btn-secondary text-sm" onClick={() => router.push("/tasks")}>
                View All
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => {
                    const badge = statusBadge(task.status);
                    return (
                      <tr key={task.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{task.title}</td>
                        <td>{task.project?.name || "—"}</td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                        <td>
                          <span className="flex items-center">
                            <span className="priority-dot" style={{ background: priorityColor(task.priority) }}></span>
                            {task.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Progress */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Project Progress</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {projects.length === 0 ? (
                <p className="text-sm text-muted">No projects yet.</p>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <div key={project.id}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-dark)', fontSize: 14 }}>{project.name}</span>
                      <span className="text-xs text-muted">{project.completed}/{project.taskCount} tasks</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%`, background: 'var(--primary)' }}></div>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 4 }}>{project.progress}% complete</div>
                  </div>
                ))
              )}
              <button className="btn btn-secondary w-full" style={{ justifyContent: 'center', marginTop: 4 }} onClick={() => router.push("/projects")}>
                <ArrowUpRight size={14} />
                View All Projects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
