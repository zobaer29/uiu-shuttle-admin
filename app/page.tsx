"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const routes = [
  { name: "UIU ↔ Notunbazar", active: 2, next: "08:30 AM" },
  { name: "UIU ↔ Kuril", active: 1, next: "09:00 AM" },
  { name: "UIU ↔ Aftabnagar", active: 1, next: "09:15 AM" },
];

const stats = [
  { label: "Active buses", value: "04", detail: "of 08 assigned" },
  { label: "Active trips", value: "04", detail: "All routes covered" },
  { label: "Passengers today", value: "186", detail: "+12% from yesterday" },
  { label: "Average occupancy", value: "68%", detail: "Within safe capacity" },
];

export default function Dashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  function logout() {
    sessionStorage.removeItem("uiu-admin-authenticated");
    router.replace("/login");
  }

  useEffect(() => {
    if (sessionStorage.getItem("uiu-admin-authenticated") !== "true") {
      router.replace("/login");
      return;
    }

    setAuthenticated(true);
  }, [router]);

  if (!authenticated) {
    return <main className="login-shell"><p>Loading dashboard...</p></main>;
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">U</span><span>UIU Shuttle</span></div>
        <nav>
          <a className="active" href="/">Overview</a>
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
        <header className="topbar"><div><p className="eyebrow">Management portal</p><h1>Good morning, Admin</h1></div><div className="profile"><span>AD</span><span>Administrator</span><button type="button" onClick={logout}>Log out</button></div></header>
        <section className="hero"><div><p className="eyebrow">Live overview · 04 Nov 2026</p><h2>Move students safely.</h2><p className="hero-copy">Monitor every active shuttle and keep the campus connected.</p></div><button>＋ Create schedule</button></section>
        <section className="stat-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><p>{stat.label}</p><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</section>
        <div className="section-heading"><div><p className="eyebrow">Today&apos;s service</p><h2>Route operations</h2></div><a href="#routes">Manage routes →</a></div>
        <section className="route-grid" id="routes">{routes.map((route, index) => <article className="route-card" key={route.name}><div className="route-icon">{index + 1}</div><div className="route-title"><h3>{route.name}</h3><span className="live"><i /> {route.active} active {route.active === 1 ? "bus" : "buses"}</span></div><div className="route-time"><small>Next departure</small><strong>{route.next}</strong></div><div className="progress"><span style={{ width: `${55 + index * 12}%` }} /></div></article>)}</section>
        <section className="lower-grid"><article className="panel" id="trips"><div className="panel-heading"><div><p className="eyebrow">In progress</p><h2>Live trips</h2></div><span className="pill">4 active</span></div><div className="trip-row"><span className="bus-badge">B-102</span><div><strong>UIU → Notunbazar</strong><small>Driver: Md. Rahman · Started 08:02 AM</small></div><b>72%</b></div><div className="trip-row"><span className="bus-badge blue">B-205</span><div><strong>UIU → Kuril</strong><small>Driver: S. Ahmed · Started 08:16 AM</small></div><b>54%</b></div><div className="trip-row"><span className="bus-badge orange">B-301</span><div><strong>Aftabnagar → UIU</strong><small>Driver: M. Hasan · Started 08:21 AM</small></div><b>81%</b></div></article><article className="panel" id="schedules"><div className="panel-heading"><div><p className="eyebrow">Upcoming</p><h2>Next departures</h2></div><a href="#schedules">View all</a></div><div className="schedule-row"><strong>08:30</strong><span>UIU → Notunbazar</span><em>On time</em></div><div className="schedule-row"><strong>09:00</strong><span>UIU → Kuril</span><em>On time</em></div><div className="schedule-row"><strong>09:15</strong><span>UIU → Aftabnagar</span><em>Scheduled</em></div><div className="schedule-row"><strong>09:30</strong><span>Notunbazar → UIU</span><em>Scheduled</em></div></article></section>
      </section>
    </main>
  );
}
