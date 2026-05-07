"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, MoreHorizontal } from "lucide-react";

export default function Team() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadTeam();
  }, [status]);

  const loadTeam = async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    setMembers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const colors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#0284c7"];

  if (loading) return <div style={{ padding: 40 }}><p className="text-muted">Loading team...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">Manage your team and their roles</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{members.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{members.filter((m) => m.role === "ADMIN").length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Members</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{members.filter((m) => m.role === "MEMBER").length}</div>
        </div>
      </div>

      {/* Members Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header">
          <span className="card-title">All Members</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Tasks</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => {
                const initials = member.name ? member.name.split(" ").map(n => n[0]).join("").toUpperCase() : "?";
                return (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar-sm" style={{ background: colors[i % colors.length], marginLeft: 0, width: 36, height: 36, fontSize: 13 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                            {member.name}
                            {member.id === session?.user?.id && (
                              <span className="text-xs text-muted" style={{ marginLeft: 6 }}>(You)</span>
                            )}
                          </div>
                          <div className="text-xs text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${member.role === "ADMIN" ? "badge-blue" : "badge-gray"}`}>
                        <Shield size={12} />
                        {member.role}
                      </span>
                    </td>
                    <td>{member._count?.projects || 0}</td>
                    <td>{member._count?.tasks || 0}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
