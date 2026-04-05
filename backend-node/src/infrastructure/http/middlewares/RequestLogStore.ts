export interface RequestLog {
    method: string;
    path: string;
    statusCode: number;
    responseTimeMs: number;
    timestamp: string;
}

const MAX_LOGS = 100;
const logs: RequestLog[] = [];

export function addLog(log: RequestLog): void {
    logs.unshift(log);
    if (logs.length > MAX_LOGS) logs.pop();
}

export function getLogs(): RequestLog[] {
    return [...logs];
}
