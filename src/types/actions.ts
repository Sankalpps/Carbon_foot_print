/**
 * Shared result type for all server actions.
 */
export interface ActionResult {
  success: boolean;
  error?: string;
}
