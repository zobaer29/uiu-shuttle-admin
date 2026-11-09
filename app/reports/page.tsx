"use client";
import { AdminShell, DataTable, useApi } from "../admin-shell";
type Report = { route_name: string; trip_count: string; passenger_count: string };
export default function ReportsPage() {
  const { data, error } = useApi<Report[]>("/reports/summary");
  return <AdminShell title="Reports"><p className="page-intro">Operational summary from recorded trips and occupancy events.</p>{error ? <p className="login-error">{error}</p> : <DataTable columns={["Route", "Trips", "Passengers"]} rows={(data ?? []).map((item) => [item.route_name, item.trip_count, item.passenger_count])} />}</AdminShell>;
}
