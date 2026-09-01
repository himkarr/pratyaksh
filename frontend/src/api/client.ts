import type { Flag, Project } from "./mockData";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export async function dashboard(role: string, token: string): Promise<{projects: Project[]; flags: Flag[]}> {
  const response = await fetch(`${API_URL}/dashboard/${role}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Dashboard request failed");
  return response.json();
}
