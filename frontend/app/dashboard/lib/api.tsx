"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function getToken(): string {
  return localStorage.getItem("token") ?? sessionStorage.getItem("token") ?? "";
}

export function getCurrentUsername(): string {
  try {
    const token = getToken();
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? payload.username ?? "";
  } catch { return ""; }
}

export function isTestUser(): boolean {
  return getCurrentUsername().toLowerCase() === "test";
}

// A 401 here means the token is missing/expired/invalid — every ledger (Gastos,
// Ingresos, Ahorro) and the "+" dialogs route through this, so handling it once
// here sends the user back to /login instead of each caller silently rendering
// an empty list.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`, ...options.headers },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  }
  return res;
}
