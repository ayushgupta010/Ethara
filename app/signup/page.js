"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, AlertCircle } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "MEMBER" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      setLoading(false);
      if (result?.error) setError("Account created. Please sign in.");
      else { router.push("/"); router.refresh(); }
    } catch { setLoading(false); setError("Something went wrong. Please try again."); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 440, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ color: "var(--primary)", display: "inline-flex", marginBottom: 16 }}><Zap size={36} fill="currentColor" /></div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-dark)", marginBottom: 6 }}>Create your account</h1>
          <p className="text-sm text-muted">Start managing your team with TaskFlow</p>
        </div>
        {error && (
          <div style={{ background: "var(--red-bg)", color: "var(--red)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} />{error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="input-field" placeholder="Alex Rivera" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input-field" type="email" placeholder="name@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input-field" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "11px 16px", marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
          Already have an account?{" "}<Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
