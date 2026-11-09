"use client";
import { FormEvent, useState } from "react";
import { AdminShell, adminFetch, DataTable, useApi } from "../admin-shell";
type Driver = { university_id: string; full_name: string; email: string; phone: string; status: string };
export default function DriversPage() {
  const { data, error } = useApi<Driver[]>("/drivers");
  const [message, setMessage] = useState("");
  async function createDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await adminFetch("/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setMessage(response.ok ? "Driver account created. Refresh to see it." : "Unable to create driver account.");
    if (response.ok) formElement.reset();
  }
  return <AdminShell title="Drivers"><p className="page-intro">Create and manage driver accounts.</p><form className="inline-form" onSubmit={createDriver}><input name="universityId" placeholder="University ID" required /><input name="fullName" placeholder="Full name" required /><input name="email" type="email" placeholder="Email" required /><input name="phone" placeholder="Phone" /><input name="password" type="password" placeholder="Temporary password (8+ chars)" minLength={8} required /><button type="submit">Create driver</button></form>{message && <p className="form-message">{message}</p>}{error ? <p className="login-error">{error}</p> : <DataTable columns={["ID", "Name", "Email", "Phone", "Status"]} rows={(data ?? []).map((driver) => [driver.university_id, driver.full_name, driver.email, driver.phone ?? "—", driver.status])} />}</AdminShell>;
}
