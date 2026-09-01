import { createContext, useContext, useState } from "react";
import { users } from "../api/mockData";
export type Role = "mp" | "state_nodal" | "district" | "ministry";
type User = (typeof users)[number];
const RoleContext = createContext<{user: User; setRole: (role: Role) => void}>({ user: users[0], setRole: () => undefined });
export function RoleProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState(users[0]);
  return <RoleContext.Provider value={{user, setRole: role => setUser(users.find(item => item.role === role) ?? users[0])}}>{children}</RoleContext.Provider>;
}
export const useRole = () => useContext(RoleContext);
