/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: ErrorBoundary (Stakeholder Switch Portal & Fault Tolerance)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Prevents blank screens and fatal runtime traps. If an exception occurs in any
 * dashboard or component, this ErrorBoundary catches it and presents the authentic
 * Stakeholder Switch Portal (<LoginModal>) so the user can immediately switch
 * perspectives or cancel gracefully.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Role, User as UserType } from "../auth/roleContext";
import { LoginModal } from "./LoginModal";

interface Props {
  children: ReactNode;
  activeRole?: Role;
  onSelectRole?: (role: Role, user?: UserType) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Pratyaksh Handled Dashboard Fault:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.activeRole !== this.props.activeRole && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  private handleClose = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <LoginModal
          isOpen={true}
          onClose={this.handleClose}
          initialRole={this.props.activeRole}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
