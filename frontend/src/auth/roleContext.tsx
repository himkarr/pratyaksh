import { createContext, useContext, useState } from "react";
import { users } from "../api/mockData";
export type Role = "mp" | "state_nodal" | "district" | "ministry";
type User = (typeof users)[number];
const RoleContext = createContext<{user: User; token?: string; setRole: (role: Role) => void; login: (email: string, password: string) => Promise<void>}>({ user: users[0], setRole: () => undefined, login: async () => undefined });
export function RoleProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState(users[0]);
  const [token, setToken] = useState<string>();
  const login = async (email: string, password: string) => { const response = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/auth/login`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})}); if (!response.ok) throw new Error("Login failed"); const data = await response.json(); setToken(data.access_token); setUser(users.find(item => item.role === data.role) ?? users[0]); };
  return <RoleContext.Provider value={{user, token, login, setRole: role => setUser(users.find(item => item.role === role) ?? users[0])}}>{children}</RoleContext.Provider>;
}
export const useRole = () => useContext(RoleContext);
