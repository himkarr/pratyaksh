import { createRoot } from "react-dom/client";
import "./style.css";
import { RoleProvider, useRole } from "./auth/roleContext";
import { MPDashboard } from "./dashboards/MPDashboard"; import { StateNodalDashboard } from "./dashboards/StateNodalDashboard"; import { DistrictDashboard } from "./dashboards/DistrictDashboard"; import { MinistryDashboard } from "./dashboards/MinistryDashboard";
function App() { const {user, setRole} = useRole(); let view: React.ReactNode; switch (user.role) { case "mp": view = <MPDashboard />; break; case "state_nodal": view = <StateNodalDashboard />; break; case "district": view = <DistrictDashboard />; break; default: view = <MinistryDashboard />; } return <><header><strong>MPLAD Aqua</strong><select value={user.role} onChange={e => setRole(e.target.value as never)}><option value="mp">MP</option><option value="state_nodal">State Nodal</option><option value="district">District</option><option value="ministry">Ministry</option></select></header>{view}</>; }
createRoot(document.getElementById("root")!).render(<RoleProvider><App /></RoleProvider>);
