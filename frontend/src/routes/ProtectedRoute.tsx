import React from "react";
import { useRole, Role } from "../auth/roleContext";
import { LoginPage } from "../pages/LoginPage";
import { Alert, Button } from "../components/ui";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { isAuthenticated, user, setRole } = useRole();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <Alert type="danger" title="Access Denied (403 Unauthorized)">
          Your current role (<strong>{user.role.toUpperCase()}</strong>) does not have authorization to view this resource.
        </Alert>
        <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button variant="secondary" onClick={() => setRole(allowedRoles[0])}>
            Switch to Authorized Role ({allowedRoles[0]})
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
