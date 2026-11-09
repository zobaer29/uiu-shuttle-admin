"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminShell, adminFetch, DataTable, useApi } from "../admin-shell";
type Trip = { id: string; route_name: string; display_name: string | null; registration_number: string; direction: string; status: string };
type Route = { id: string; name: string };
type Bus = { id: string; display_name: string | null; registration_number: string };
type Driver = { id: string; full_name: string };
type Student = { id: string; university_id: string; full_name: string; email: string | null };
type StudentLocation = { latitude: string; longitude: string; accuracy_meters: string | null; recorded_at: string } | null;
export default function TripsPage() {
  const { data, error } = useApi<Trip[]>("/trips/active");
  const { data: routes } = useApi<Route[]>("/routes");
  const { data: buses } = useApi<Bus[]>("/buses");
  const { data: drivers } = useApi<Driver[]>("/drivers");
  const { data: students } = useApi<Student[]>("/students");
  const [message, setMessage] = useState("");
  async function startTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await adminFetch("/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    setMessage(response.ok ? "Trip started. Refresh to see it." : "Unable to start trip.");
    if (response.ok) formElement.reset();
  }
  async function endTrip(tripId: string) {
    const response = await adminFetch(`/trips/${tripId}/end`, { method: "PUT" });
    setMessage(response.ok ? "Trip ended. Refresh to update the list." : "Unable to end trip.");
  }
  return <AdminShell title="Live trips"><p className="page-intro">Start, monitor, and complete shuttle trips.</p><form className="inline-form" onSubmit={startTrip}><select name="routeId" required defaultValue=""><option value="" disabled>Route</option>{(routes ?? []).map((route) => <option value={route.id} key={route.id}>{route.name}</option>)}</select><select name="busId" required defaultValue=""><option value="" disabled>Bus</option>{(buses ?? []).map((bus) => <option value={bus.id} key={bus.id}>{bus.display_name ?? bus.registration_number}</option>)}</select><select name="driverId" required defaultValue=""><option value="" disabled>Driver</option>{(drivers ?? []).map((driver) => <option value={driver.id} key={driver.id}>{driver.full_name}</option>)}</select><select name="direction" defaultValue="outbound"><option value="outbound">Outbound</option><option value="return">Return</option></select><button type="submit">Start trip</button></form>{message && <p className="form-message">{message}</p>}{error ? <p className="login-error">{error}</p> : <DataTable columns={["Route", "Bus", "Registration", "Direction", "Status"]} rows={(data ?? []).map((trip) => [trip.route_name, trip.display_name ?? "Unnamed bus", trip.registration_number, trip.direction, trip.status])} />}{(data ?? []).map((trip) => <button className="table-action" key={trip.id} onClick={() => endTrip(trip.id)}>End {trip.route_name}</button>)}<StudentLocationPanel students={students ?? []} /></AdminShell>;
}

function StudentLocationPanel({ students }: { students: Student[] }) {
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [location, setLocation] = useState<StudentLocation>(null);
  const matches = useMemo(() => students.filter((student) => `${student.full_name} ${student.university_id} ${student.email ?? ""}`.toLowerCase().includes(query.toLowerCase())), [query, students]);

  useEffect(() => {
    if (!studentId) {
      setLocation(null);
      return;
    }
    let active = true;
    const load = () => adminFetch(`/students/${studentId}/location`).then((response) => response.json()).then((nextLocation: StudentLocation) => {
      if (active) setLocation(nextLocation);
    }).catch(() => { if (active) setLocation(null); });
    load();
    const interval = window.setInterval(load, 3000);
    return () => { active = false; window.clearInterval(interval); };
  }, [studentId]);

  return <section className="panel student-location-panel"><div className="panel-heading"><div><h2>Find student location</h2><p className="page-intro">Live GPS updates refresh every 3 seconds.</p></div></div><input className="student-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, student ID, or email" /><select className="student-select" value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Select a student</option>{matches.map((student) => <option key={student.id} value={student.id}>{student.full_name} · {student.university_id}</option>)}</select>{studentId && location ? <div className="location-result"><strong>Live location found</strong><span>Latitude: {Number(location.latitude).toFixed(7)}</span><span>Longitude: {Number(location.longitude).toFixed(7)}</span><span>Accuracy: {location.accuracy_meters ? `${Number(location.accuracy_meters).toFixed(1)} m` : "Unknown"}</span><span>Updated: {new Date(location.recorded_at).toLocaleTimeString()}</span><a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer">Open precise location in map</a></div> : studentId ? <p className="empty-state">No recent location received from this student.</p> : <p className="empty-state">Choose a student to track their latest location.</p>}</section>;
}
