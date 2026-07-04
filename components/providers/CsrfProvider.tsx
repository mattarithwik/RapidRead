"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CsrfContext = createContext<string>("");

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken ?? ""))
      .catch(() => setCsrfToken(""));
  }, []);

  return <CsrfContext.Provider value={csrfToken}>{children}</CsrfContext.Provider>;
}

export function useCsrfToken() {
  return useContext(CsrfContext);
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}, csrfToken?: string) {
  const headers = new Headers(init.headers);
  if (csrfToken) headers.set("x-csrf-token", csrfToken);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}
