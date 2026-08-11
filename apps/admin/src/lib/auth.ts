import { createAuthClient } from "better-auth/react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:8787");

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  fetchOptions: { credentials: "include" },
});

export const { signIn, signOut, useSession } = authClient;
