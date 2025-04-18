/**
 * Types for report sharing functionality
 */

export interface ShareSettings {
  /**
   * Whether comments are allowed on the shared report
   */
  allowComments: boolean;

  /**
   * Whether authentication is required to view the report
   */
  requireAuth: boolean;

  /**
   * Optional expiry date for the share link (ISO string)
   */
  expiryDate: string | null;

  /**
   * Sharing mode - "anyone" allows any authenticated user to view,
   * "specific" allows only specific users to view
   */
  sharingMode?: "anyone" | "specific";

  /**
   * List of email addresses of users who are allowed to view the report
   * Only used when sharingMode is "specific"
   */
  allowedViewers?: string[];
}

export interface ShareRequest {
  /**
   * Whether comments are allowed on the shared report
   */
  allowComments: boolean;

  /**
   * Whether authentication is required to view the report
   */
  requireAuth: boolean;

  /**
   * Optional expiry date for the share link (ISO string)
   */
  expiryDate: string | null;

  /**
   * Sharing mode - "anyone" allows any authenticated user to view,
   * "specific" allows only specific users to view
   */
  sharingMode: "anyone" | "specific";

  /**
   * List of email addresses of users who are allowed to view the report
   * Only used when sharingMode is "specific"
   */
  allowedViewers: string[];
}

export interface ShareResponse {
  /**
   * The full URL that can be shared to access the report
   */
  shareUrl: string;

  /**
   * The unique token part of the URL
   */
  shareToken: string;

  /**
   * The settings used for this share
   */
  shareSettings: ShareSettings;
}
