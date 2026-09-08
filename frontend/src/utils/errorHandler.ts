/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: utils/errorHandler.ts (Central Error Sanitization & User Messaging)
 * ============================================================================
 * 
 * Purpose:
 * Sanitizes HTTP error responses (400, 401, 403, 404, 409, 422, 429, 500, network failure)
 * into clean, user-friendly natural language messages without exposing raw stack traces.
 */

import { ApiError } from "../api/client";

export function formatErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again.";

  if (err instanceof ApiError) {
    switch (err.status) {
      case 0:
        return "Network unavailable or backend server is offline. Please check your connection.";
      case 400:
        return err.message || "Invalid input parameters provided. Please check your entries.";
      case 401:
        return "Your session has expired or authentication failed. Please log in again.";
      case 403:
        return "Access forbidden: Your account role does not have permission for this resource.";
      case 404:
        return "The requested record or resource could not be found.";
      case 409:
        return "Conflict: This record already exists or violates database constraints.";
      case 422:
        return "Validation failed: Please ensure all required form fields are correctly formatted.";
      case 429:
        return "Too many requests. Rate limit reached. Please wait a moment before retrying.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Server error: The backend service encountered an internal issue. Please try again shortly.";
      default:
        return err.message || `Request failed with HTTP status ${err.status}.`;
    }
  }

  if (typeof err === "string") return err;
  if (err.message) return err.message;

  return "An unhandled operation failure occurred.";
}
