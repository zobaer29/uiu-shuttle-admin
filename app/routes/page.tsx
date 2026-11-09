"use client";
import { AdminShell, DataTable, useApi } from "../admin-shell";
type Route = { route_number: number; name: string; origin_name: string; destination_name: string; is_active: boolean };
export default function RoutesPage() {
  const { data, error } = useApi<Route[]>("/routes");
  return <AdminShell title="Routes & stops"><p className="page-intro">Active shuttle routes configured in the database.</p>{error ? <p className="login-error">{error}</p> : <DataTable columns={["Route", "Name", "Origin", "Destination", "Status"]} rows={(data ?? []).map((route) => [`Route ${route.route_number}`, route.name, route.origin_name, route.destination_name, route.is_active ? "Active" : "Inactive"])} />}</AdminShell>;
}
