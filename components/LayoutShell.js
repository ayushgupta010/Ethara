"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";

const authPages = ["/login", "/signup"];

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAuthPage = authPages.includes(pathname);

  // Auth pages: no sidebar, full width
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Loading state
  if (status === "loading") {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  // Not logged in on protected page → redirect would happen via middleware, but show anyway
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
