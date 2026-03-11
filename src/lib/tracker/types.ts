// ─────────────────────────────────────────────────────────────────
// Tracker System – TypeScript Types
// Used by both the web app and the Electron desktop tracker app.
// ─────────────────────────────────────────────────────────────────

// ── DB row types ──────────────────────────────────────────────────

export type TrackerSessionStatus = "active" | "ended" | "abandoned";
export type ScreenshotUploadStatus = "pending" | "uploading" | "uploaded" | "failed";

export interface TrackerDevice {
    id: string;
    user_id: string;
    device_name: string;
    last_seen_at: string | null;
    last_ip: string | null;
    is_active: boolean;
    revoked_at: string | null;
    created_at: string;
}

export interface TrackerSession {
    id: string;
    device_id: string;
    user_id: string;
    employer_id: string | null;
    job_id: string | null;
    started_at: string;
    ended_at: string | null;
    status: TrackerSessionStatus;
    total_seconds: number | null;
    last_heartbeat_at: string | null;
    memo: string | null;
    created_at: string;
}

export interface Screenshot {
    id: string;
    session_id: string;
    device_id: string;
    user_id: string;
    employer_id: string | null;
    storage_path: string | null;
    status: ScreenshotUploadStatus;
    captured_at: string;
    upload_attempted_at: string | null;
    upload_confirmed_at: string | null;
    file_size_bytes: number | null;
    created_at: string;
}

export interface ActivityLog {
    id: string;
    session_id: string;
    device_id: string;
    user_id: string;
    employer_id: string | null;
    logged_at: string;
    keyboard_events: number;
    mouse_events: number;
    active_app: string | null;
    active_window: string | null;
    created_at: string;
}

// ── Tracker app → API request/response types ──────────────────────
// These define the exact contract the Electron app must implement.

/**
 * POST /api/tracker/auth/exchange
 * Exchanges a web-generated pairing code for a permanent device token.
 * Called once during device setup.
 */
export interface PairExchangeRequest {
    /** Raw 8-char code displayed on the web dashboard (e.g. "A3KX9P2B") */
    pairing_code: string;
    /** Human-readable device label shown in the web dashboard */
    device_name: string;
}

export interface PairExchangeResponse {
    device_id: string;
    /** Store this securely. Use electron safeStorage or keytar. Never log it. */
    device_token: string;
    user_id: string;
}

/**
 * POST /api/tracker/session/start
 * Starts a new tracked work session.
 * Authorization: Bearer <device_token>
 */
export interface SessionStartRequest {
    /** Supabase user ID of the employer being worked for (optional) */
    employer_id?: string;
    /** Job post ID this session is linked to (optional) */
    job_id?: string;
    /** Optional memo, e.g. "Working on homepage redesign" */
    memo?: string;
}

export interface SessionStartResponse {
    session_id: string;
    started_at: string;
}

/**
 * POST /api/tracker/session/end
 * Ends the current active session and calculates total_seconds.
 * Authorization: Bearer <device_token>
 */
export interface SessionEndRequest {
    session_id: string;
}

export interface SessionEndResponse {
    session_id: string;
    total_seconds: number;
    ended_at: string;
}

/**
 * POST /api/tracker/heartbeat
 * Sent every 30 seconds to keep session alive + log activity.
 * Authorization: Bearer <device_token>
 */
export interface HeartbeatRequest {
    session_id: string;
    /** Count of keyboard events in the last interval */
    keyboard_events: number;
    /** Count of mouse move/click events in the last interval */
    mouse_events: number;
    /** Name of the active application (e.g. "Google Chrome") */
    active_app?: string;
    /** Title of the active window */
    active_window?: string;
    /** ISO timestamp from the desktop clock */
    logged_at: string;
}

export interface HeartbeatResponse {
    ok: boolean;
}

/**
 * POST /api/tracker/screenshot/request
 * Request a signed upload URL for a screenshot.
 * Call this before uploading. Creates a 'pending' row in the DB.
 * Authorization: Bearer <device_token>
 */
export interface ScreenshotRequestPayload {
    session_id: string;
    /** ISO timestamp of when the screenshot was captured on the desktop */
    captured_at: string;
    file_size_bytes?: number;
}

export interface ScreenshotRequestResponse {
    screenshot_id: string;
    /** PUT to this URL with the PNG file. Signed, expires in 5 minutes. */
    upload_url: string;
    /** The storage path to pass back in the confirm call */
    storage_path: string;
    /** Seconds until upload_url expires */
    expires_in: number;
}

/**
 * POST /api/tracker/screenshot/confirm
 * Called after a successful upload to mark the screenshot as 'uploaded'.
 * If upload failed, call this with status='failed' to mark for retry.
 * Authorization: Bearer <device_token>
 */
export interface ScreenshotConfirmRequest {
    screenshot_id: string;
    storage_path: string;
    file_size_bytes: number;
    status: "uploaded" | "failed";
}

export interface ScreenshotConfirmResponse {
    ok: boolean;
}

// ── Internal / middleware types ────────────────────────────────────

export interface TrackerAuthContext {
    deviceId: string;
    userId: string;
}

// ── API error shape ────────────────────────────────────────────────

export interface ApiError {
    error: string;
    code?: string;
}
