export type CheckResult =
    | { status: "activated" }
    | { status: "not_found"; attemptsLeft: number }
    | { status: "no_retries" }
    | { status: "error"; message: string };
