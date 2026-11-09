"use client";
import { FormEvent, useState } from "react";
import { AdminShell, adminFetch, DataTable, useApi } from "../admin-shell";
type Bus = {
  registration_number: string;
  display_name: string | null;
  capacity: number;
  is_active: boolean;
};
export default function BusesPage() {
  const { data, error } = useApi<Bus[]>("/buses");
  const [message, setMessage] = useState("");
  async function createBus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await adminFetch("/buses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...Object.fromEntries(form),
        capacity: Number(form.get("capacity")),
      }),
    });
    setMessage(
      response.ok ? "Bus created. Refresh to see it." : "Unable to create bus.",
    );
    if (response.ok) formElement.reset();
  }
  return (
    <AdminShell title="Buses">
      <p className="page-intro">Create and manage fleet vehicles.</p>
      <form className="inline-form" onSubmit={createBus}>
        <input
          name="registrationNumber"
          placeholder="Registration number"
          required
        />
        <input name="displayName" placeholder="Display name" />
        <input
          name="capacity"
          type="number"
          min="1"
          placeholder="Capacity"
          required
        />
        <button type="submit">Add bus</button>
      </form>
      {message && <p className="form-message">{message}</p>}
      {error ? (
        <p className="login-error">{error}</p>
      ) : (
        <DataTable
          columns={["Registration", "Name", "Capacity", "Status"]}
          rows={(data ?? []).map((bus) => [
            bus.registration_number,
            bus.display_name ?? "—",
            String(bus.capacity),
            bus.is_active ? "Active" : "Inactive",
          ])}
        />
      )}
    </AdminShell>
  );
}
