"use client";
import { AdminShell, DataTable, useApi } from "../admin-shell";
type Contact = { label: string; phone_number: string; description: string; is_emergency: boolean };
export default function ContactsPage() {
  const { data, error } = useApi<Contact[]>("/contacts");
  return <AdminShell title="Service contacts"><p className="page-intro">Support and emergency contacts visible to shuttle users.</p>{error ? <p className="login-error">{error}</p> : <DataTable columns={["Label", "Phone", "Description", "Type"]} rows={(data ?? []).map((contact) => [contact.label, contact.phone_number, contact.description, contact.is_emergency ? "Emergency" : "General"])} />}</AdminShell>;
}
