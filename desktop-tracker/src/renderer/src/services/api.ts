import { trackerStore, type DeviceInfo } from "./store";

// ── API types (matches the web app's src/lib/tracker/types.ts) ─────

export interface PairExchangeResponse {
    device_id: string;
    device_token: string;
    user_id: string;
}

export interface SessionStartResponse {
    session_id: string;
    started_at: string;
}

export interface SessionEndResponse {
    session_id: string;
    total_seconds: number;
    ended_at: string;
}

export interface HeartbeatRequest {
    session_id: string;
    keyboard_events: number;
    mouse_events: number;
    active_app?: string;
    active_window?: string;
    logged_at: string;
}

export interface ScreenshotRequestResponse {
    screenshot_id: string;
    upload_url: string;
    storage_path: string;
    expires_in: number;
}

// ── API client ─────────────────────────────────────────────────────

class TrackerApiClient {
    private async baseUrl(): Promise<string> {
        return trackerStore.getApiBaseUrl();
    }

    // ── Unauthenticated ──────────────────────────────────────────

    /** Exchange a pairing code for a device token (called once during setup) */
    async exchangePairingCode(
        pairingCode: string,
        deviceName: string
    ): Promise<PairExchangeResponse> {
        const base = await this.baseUrl();
        const res = await fetch(`${base}/api/tracker/auth/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pairing_code: pairingCode, device_name: deviceName }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data as PairExchangeResponse;
    }

    // ── Authenticated (Bearer device_token) ──────────────────────

    private async authFetch(
        path: string,
        options: RequestInit,
        device: DeviceInfo
    ): Promise<Response> {
        const base = await this.baseUrl();
        return fetch(`${base}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${device.deviceToken}`,
                ...(options.headers ?? {}),
            },
        });
    }

    /** Start a new work session */
    async startSession(
        device: DeviceInfo,
        opts: { employer_id?: string; job_id?: string; memo?: string } = {}
    ): Promise<SessionStartResponse> {
        const res = await this.authFetch(
            "/api/tracker/session/start",
            { method: "POST", body: JSON.stringify(opts) },
            device
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data as SessionStartResponse;
    }

    /** End the current active session */
    async endSession(device: DeviceInfo, sessionId: string): Promise<SessionEndResponse> {
        const res = await this.authFetch(
            "/api/tracker/session/end",
            { method: "POST", body: JSON.stringify({ session_id: sessionId }) },
            device
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data as SessionEndResponse;
    }

    /** Send a heartbeat + activity metrics */
    async sendHeartbeat(device: DeviceInfo, payload: HeartbeatRequest): Promise<void> {
        const res = await this.authFetch(
            "/api/tracker/heartbeat",
            { method: "POST", body: JSON.stringify(payload) },
            device
        );
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Heartbeat HTTP ${res.status}`);
        }
    }

    /**
     * Request a signed URL to upload a screenshot.
     * Step 1 of 2 in the screenshot upload flow.
     */
    async requestScreenshotUpload(
        device: DeviceInfo,
        sessionId: string,
        capturedAt: string,
        fileSizeBytes?: number
    ): Promise<ScreenshotRequestResponse> {
        const res = await this.authFetch(
            "/api/tracker/screenshot/request",
            {
                method: "POST",
                body: JSON.stringify({
                    session_id: sessionId,
                    captured_at: capturedAt,
                    file_size_bytes: fileSizeBytes,
                }),
            },
            device
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data as ScreenshotRequestResponse;
    }

    /**
     * Confirm a screenshot upload succeeded or failed.
     * Step 2 of 2 in the screenshot upload flow.
     */
    async confirmScreenshotUpload(
        device: DeviceInfo,
        screenshotId: string,
        storagePath: string,
        fileSizeBytes: number,
        status: "uploaded" | "failed"
    ): Promise<void> {
        const res = await this.authFetch(
            "/api/tracker/screenshot/confirm",
            {
                method: "POST",
                body: JSON.stringify({
                    screenshot_id: screenshotId,
                    storage_path: storagePath,
                    file_size_bytes: fileSizeBytes,
                    status,
                }),
            },
            device
        );
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Confirm HTTP ${res.status}`);
        }
    }
}

export const api = new TrackerApiClient();
