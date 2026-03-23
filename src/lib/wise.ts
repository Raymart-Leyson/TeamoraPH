import crypto from "crypto";

// ─── Config ───────────────────────────────────────────────────────────────────

export const WISE_API_URL =
    process.env.WISE_API_URL ?? "https://api.wise-sandbox.com";

const WISE_API_TOKEN = process.env.WISE_API_TOKEN ?? "";

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export function wiseHeaders() {
    return {
        Authorization: `Bearer ${WISE_API_TOKEN}`,
        "Content-Type": "application/json",
    };
}

export async function wiseGet<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${WISE_API_URL}${path}`, {
        headers: wiseHeaders(),
        cache: "no-store",
    });
    if (!res.ok) {
        throw new Error(`Wise API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
}

export async function wisePost<T = unknown>(
    path: string,
    body: object
): Promise<T> {
    const res = await fetch(`${WISE_API_URL}${path}`, {
        method: "POST",
        headers: wiseHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`Wise API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
}

// ─── Reference generation ─────────────────────────────────────────────────────

/**
 * Generates a unique payment reference the employer includes in their transfer
 * description so the webhook can match it back to their subscription.
 * Format: TMRA-PRO-A1B2C3D4
 */
export function generateWiseReference(plan: string): string {
    const planCode = plan.toUpperCase().slice(0, 3);
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `TMRA-${planCode}-${random}`;
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Wise signs webhook payloads with RSA-SHA256.
 * The signature is sent as Base64 in the `X-Signature-SHA256` header.
 * The public key is provided by Wise (different for sandbox vs production).
 */
export function verifyWiseSignature(
    rawBody: string,
    signatureBase64: string
): boolean {
    const publicKey = process.env.WISE_WEBHOOK_PUBLIC_KEY;
    if (!publicKey) {
        // In development without a key configured, allow test notifications through
        return true;
    }

    try {
        return crypto.verify(
            "sha256",
            Buffer.from(rawBody),
            { key: publicKey, format: "pem" },
            Buffer.from(signatureBase64, "base64")
        );
    } catch {
        return false;
    }
}

// ─── Profile & account helpers ────────────────────────────────────────────────

export interface WiseProfile {
    id: number;
    type: "personal" | "business";
    fullName?: string;
}

export async function getProfiles(): Promise<WiseProfile[]> {
    return wiseGet<WiseProfile[]>("/v1/profiles");
}

export interface WiseBalanceAccount {
    id: string;
    currency: string;
    type: string;
    balance: { value: number; currency: string };
}

export async function getBalanceAccounts(
    profileId: number
): Promise<WiseBalanceAccount[]> {
    return wiseGet<WiseBalanceAccount[]>(
        `/v1/profiles/${profileId}/balance-accounts`
    );
}

export interface WiseAccountDetail {
    id: string;
    currency: string;
    type: string;
    details: Record<string, string>;
    accountHolderName?: string;
}

export async function getAccountDetails(
    profileId: number
): Promise<WiseAccountDetail[]> {
    return wiseGet<WiseAccountDetail[]>(
        `/v1/profiles/${profileId}/account-details`
    );
}

// ─── Webhook subscription helpers ────────────────────────────────────────────

export async function subscribeToCredits(
    profileId: number,
    notificationUrl: string
) {
    return wisePost(`/v1/profiles/${profileId}/subscriptions`, {
        eventType: "balances#credit",
        notificationUrl,
        level: "profile",
    });
}

// ─── Transaction lookup ───────────────────────────────────────────────────────

export interface WiseTransaction {
    type: "CREDIT" | "DEBIT";
    date: string;
    amount: { value: number; currency: string };
    details: {
        description?: string;
        paymentReference?: string;
        senderName?: string;
        type?: string;
    };
    referenceNumber?: string;
}

interface BalanceStatement {
    transactions: WiseTransaction[];
}

/**
 * Returns the Wise balance account ID for a given currency.
 * PHP → WISE_PHP_BALANCE_ACCOUNT_ID
 * USD → WISE_USD_BALANCE_ACCOUNT_ID
 */
export function getBalanceAccountId(currency: "PHP" | "USD" | string): string {
    if (currency === "USD") return process.env.WISE_USD_BALANCE_ACCOUNT_ID ?? "";
    return process.env.WISE_PHP_BALANCE_ACCOUNT_ID ?? "";
}

/**
 * Searches a balance statement for a credit matching the given reference.
 * Looks back up to `daysBack` days (default 7).
 */
export async function findTransactionByReference(
    profileId: number,
    balanceAccountId: string,
    reference: string,
    currency = "PHP",
    daysBack = 7
): Promise<WiseTransaction | null> {
    const intervalEnd = new Date();
    const intervalStart = new Date();
    intervalStart.setDate(intervalStart.getDate() - daysBack);

    const params = new URLSearchParams({
        currency,
        intervalStart: intervalStart.toISOString(),
        intervalEnd: intervalEnd.toISOString(),
    });

    const data = await wiseGet<BalanceStatement>(
        `/v1/profiles/${profileId}/balance-accounts/${balanceAccountId}/statement.json?${params}`
    );

    const refUpper = reference.toUpperCase();

    return (
        data.transactions?.find((tx) => {
            if (tx.type !== "CREDIT") return false;
            const desc = (tx.details?.description ?? "").toUpperCase();
            const ref = (tx.details?.paymentReference ?? "").toUpperCase();
            return desc.includes(refUpper) || ref.includes(refUpper);
        }) ?? null
    );
}

// ─── Sandbox simulation ───────────────────────────────────────────────────────

/**
 * Simulate an incoming payment in the Wise sandbox environment.
 * Triggers a swift-in#credit webhook to your registered endpoint.
 */
export async function simulateIncomingPayment({
    balanceAccountId,
    amount,
    currency = "PHP",
    senderName,
    reference,
}: {
    balanceAccountId: string;
    amount: number;
    currency?: string;
    senderName: string;
    reference: string;
}) {
    return wisePost("/v1/simulations/incoming-payment", {
        balanceAccountId,
        amount: amount.toString(),
        currency,
        senderName,
        reference,
    });
}
