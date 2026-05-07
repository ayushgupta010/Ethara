"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, User, Bell, Lock, Palette, CheckCircle2, AlertCircle } from "lucide-react";

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "security", name: "Security", icon: Lock },
    { id: "appearance", name: "Appearance", icon: Palette },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and workspace preferences</p>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "220px 1fr", gap: 32 }}>
        {/* Settings Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className="nav-item"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "var(--primary-light)" : "transparent",
                  color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  gap: '12px'
                }}
              >
                <Icon size={18} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "profile" && <ProfileTab session={session} />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "appearance" && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────
function ProfileTab({ session }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) {
          const names = data.name.split(" ");
          setForm({ 
            firstName: names[0] || "", 
            lastName: names.slice(1).join(" ") || "", 
            email: data.email || "",
            bio: data.bio || ""
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);

    const fullName = `${form.firstName} ${form.lastName}`.trim();

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fullName, email: form.email, bio: form.bio }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage({ type: "success", text: data.message });
    } else {
      setMessage({ type: "error", text: data.error });
    }
  };

  if (loading) return <div className="card" style={{ padding: 32 }}><p className="text-muted">Loading profile...</p></div>;

  return (
    <div className="card" style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
        Profile Information
      </h2>
      <p className="text-sm text-muted" style={{ marginBottom: 28 }}>
        Update your personal details and workspace profile.
      </p>

      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "var(--green-bg)" : "var(--red-bg)",
            color: message.type === "success" ? "var(--green)" : "var(--red)",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="input-field"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="input-field"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="input-field"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <select 
            className="input-field" 
            value={session?.user?.role || "MEMBER"} 
            disabled 
            style={{ background: "#f9fafb" }}
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            className="input-field"
            rows={4}
            placeholder="Tell us a bit about yourself..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            style={{ resize: 'none' }}
          />
        </div>

        <div
          style={{
            paddingTop: 20,
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={() => router.refresh()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.currentPassword) return setMessage({ type: "error", text: "Current password is required" });
    if (form.newPassword.length < 6) return setMessage({ type: "error", text: "New password must be at least 6 characters" });
    if (form.newPassword !== form.confirmPassword) return setMessage({ type: "error", text: "Passwords do not match" });

    setSaving(true);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage({ type: "success", text: data.message });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setMessage({ type: "error", text: data.error });
    }
  };

  return (
    <div className="card" style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
        Change Password
      </h2>
      <p className="text-sm text-muted" style={{ marginBottom: 28 }}>
        Update your password to keep your account secure.
      </p>

      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "var(--green-bg)" : "var(--red-bg)",
            color: message.type === "success" ? "var(--green)" : "var(--red)",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            className="input-field"
            type="password"
            placeholder="Enter your current password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            className="input-field"
            type="password"
            placeholder="Minimum 6 characters"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            className="input-field"
            type="password"
            placeholder="Re-enter your new password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>

        <div style={{ paddingTop: 20, borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Lock size={16} />
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    taskAssigned: true,
    taskCompleted: true,
    projectUpdates: true,
    dueDateReminder: true,
    teamChanges: false,
    weeklyDigest: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("notificationPrefs");
    if (stored) setPrefs(JSON.parse(stored));
  }, []);

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("notificationPrefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const options = [
    { key: "taskAssigned", label: "Task Assigned", desc: "Get notified when a task is assigned to you" },
    { key: "taskCompleted", label: "Task Completed", desc: "Get notified when a task you created is completed" },
    { key: "projectUpdates", label: "Project Updates", desc: "Receive updates about projects you are a member of" },
    { key: "dueDateReminder", label: "Due Date Reminders", desc: "Reminder notifications before task due dates" },
    { key: "teamChanges", label: "Team Changes", desc: "Get notified when new members join your projects" },
    { key: "weeklyDigest", label: "Weekly Digest", desc: "Receive a weekly summary of your workspace activity" },
  ];

  return (
    <div className="card" style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
        Notification Preferences
      </h2>
      <p className="text-sm text-muted" style={{ marginBottom: 28 }}>
        Choose which notifications you want to receive.
      </p>

      {saved && (
        <div style={{ background: "var(--green-bg)", color: "var(--green)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> Notification preferences saved
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {options.map((opt) => (
          <div
            key={opt.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: "var(--text-dark)", fontSize: 14 }}>{opt.label}</div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>{opt.desc}</div>
            </div>
            <button
              onClick={() => toggle(opt.key)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: prefs[opt.key] ? "var(--primary)" : "#e5e7eb",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  top: 3,
                  left: prefs[opt.key] ? 23 : 3,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Preferences
        </button>
      </div>
    </div>
  );
}

// ── Appearance Tab ─────────────────────────────────────
function AppearanceTab() {
  const [theme, setTheme] = useState("light");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) setTheme(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem("theme", theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const themes = [
    { id: "light", name: "Light", desc: "Clean white background with dark text", preview: "#ffffff" },
    { id: "dark", name: "Dark", desc: "Dark background with light text (coming soon)", preview: "#1e293b", disabled: true },
    { id: "system", name: "System", desc: "Follows your operating system preference (coming soon)", preview: "linear-gradient(135deg, #ffffff 50%, #1e293b 50%)", disabled: true },
  ];

  return (
    <div className="card" style={{ padding: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
        Appearance
      </h2>
      <p className="text-sm text-muted" style={{ marginBottom: 28 }}>
        Customize how TaskFlow looks for you.
      </p>

      {saved && (
        <div style={{ background: "var(--green-bg)", color: "var(--green)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> Appearance preferences saved
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <label className="form-label" style={{ marginBottom: 12 }}>Theme</label>
        <div style={{ display: "flex", gap: 16 }}>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => !t.disabled && setTheme(t.id)}
              style={{
                flex: 1,
                padding: 16,
                border: `2px solid ${theme === t.id ? "var(--primary)" : "#e5e7eb"}`,
                borderRadius: 12,
                background: theme === t.id ? "var(--primary-light)" : "white",
                textAlign: "center",
                opacity: t.disabled ? 0.5 : 1,
                cursor: t.disabled ? "not-allowed" : "pointer",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 32,
                  borderRadius: 6,
                  background: t.preview,
                  border: "1px solid #e5e7eb",
                  margin: "0 auto 10px",
                }}
              />
              <div style={{ fontWeight: 500, color: "var(--text-dark)", fontSize: 14 }}>{t.name}</div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 20, borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Preferences
        </button>
      </div>
    </div>
  );
}
