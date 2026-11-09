"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("uiu-admin-token") : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers,
  });
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("uiu-admin-authenticated");
      sessionStorage.removeItem("uiu-admin-token");
      window.location.href = "/login";
    }
  }
  return response;
}

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("uiu-admin-token")) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <main className="login-shell"><p>Loading portal...</p></main>;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">U</span><span>UIU Shuttle</span></div>
        <nav>
          <a href="/">Overview</a>
          <a href="/trips">Live trips</a>
          <a href="/routes">Routes & stops</a>
          <a href="/schedules">Schedules</a>
          <a href="/drivers">Drivers</a>
          <a href="/buses">Buses</a>
          <a href="/contacts">Contacts</a>
          <a href="/reports">Reports</a>
        </nav>
        <div className="sidebar-footer"><span className="status-dot" />System operational</div>
      </aside>
      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">Management portal</p><h1>{title}</h1></div>
          <button className="logout-button" onClick={() => {
            sessionStorage.removeItem("uiu-admin-authenticated");
            sessionStorage.removeItem("uiu-admin-token");
            router.replace("/login");
          }}>Log out</button>
        </header>
        {children}
      </section>
    </main>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="data-table">
      <div className="data-row data-head">{columns.map((column) => <strong key={column}>{column}</strong>)}</div>
      {rows.length ? rows.map((row, index) => <div className="data-row" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <span key={`${cell}-${cellIndex}`}>{cell}</span>)}</div>) : <div className="empty-state">No records found.</div>}
    </div>
  );
}

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminFetch(path).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load data");
      setData(await response.json() as T);
    }).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to load data"));
  }, [path]);
  return { data, error };
}
