import * as Linking from "expo-linking";
import {
  clearToken,
  getToken,
  isTokenExpired,
  setToken,
} from "../utlis/storage";

export const INTRA_BASE_URL = process.env.EXPO_PUBLIC_INTRA_BASE_URL;

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
  created_at?: number;
};

export type IntraUser = {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  displayname?: string;
  phone?: string | null;
  location?: string | null;
  wallet?: number;
  correction_point?: number;
  image?: {
    link?: string;
    versions?: {
      large?: string;
      medium?: string;
      small?: string;
      micro?: string;
    };
  };
  cursus_users?: {
    id: number;
    begin_at?: string | null;
    end_at?: string | null;
    grade?: string | null;
    level?: number;
    skills?: { name: string; level: number }[];
    cursus_id: number;
    has_coalition?: boolean;
  }[];
  projects_users?: {
    id: number;
    status: string;
    "validated?"?: boolean;
    final_mark?: number | null;
    project?: { id: number; name: string };
    marked_at?: string | null;
  }[];
};

export type IntraSearchResult = {
  login: string;
  cdn_uri: string;
};

export const getRedirectUri = () => {
  const envRedirect = process.env.EXPO_PUBLIC_INTRA_CLIENT_CALLBACK_URL;
  if (envRedirect) {
    try {
      // If the env mistakenly contains the full authorize URL, try to extract the redirect_uri param
      const url = new URL(envRedirect);
      if (url.pathname.includes("/oauth/authorize")) {
        const param = url.searchParams.get("redirect_uri");
        if (param) return decodeURIComponent(param);
      }
      return envRedirect;
    } catch {
      // fall through to generated
    }
  }
  // Uses Expo dev client/linking config to build a redirect URI that opens this app
  return Linking.createURL("/");
};

export const getAuthorizeUrl = (
  clientId: string,
  redirectUri: string = getRedirectUri()
) => {
  const url = new URL(`${INTRA_BASE_URL}/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  return url.toString();
};

export async function exchangeCodeForToken(
  code: string,
  {
    clientId,
    clientSecret,
    redirectUri,
  }: { clientId: string; clientSecret: string; redirectUri: string }
): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("code", code);
  body.set("redirect_uri", redirectUri);

  const res = await fetch(`${INTRA_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as TokenResponse;
  return json;
}

async function refreshTokenOrThrow(
  current: TokenResponse
): Promise<TokenResponse> {
  const clientId = process.env.EXPO_PUBLIC_INTRA_CLIENT_UID as
    | string
    | undefined;
  const clientSecret = process.env.EXPO_PUBLIC_INTRA_CLIENT_SECRET as
    | string
    | undefined;
  if (!current?.refresh_token || !clientId || !clientSecret) {
    throw new Error("Missing refresh capability or client credentials");
  }
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("refresh_token", current.refresh_token);

  const res = await fetch(`${INTRA_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }
  const next = (await res.json()) as TokenResponse;
  // The API may not include created_at; set it so we can compute expiry locally
  if (!next.created_at) next.created_at = Math.floor(Date.now() / 1000);
  return next;
}

async function getValidToken(): Promise<TokenResponse> {
  const token = await getToken();
  if (!token) throw new Error("Missing token");
  if (!isTokenExpired(token)) return token;
  // try refresh
  try {
    const refreshed = await refreshTokenOrThrow(token);
    await setToken(refreshed);
    return refreshed;
  } catch (e) {
    // If refresh fails, clear token to force a re-login downstream
    await clearToken();
    throw e instanceof Error ? e : new Error(String(e));
  }
}

async function fetchWithAuth(path: string, init?: RequestInit) {
  const token = await getValidToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token.access_token}`);
  return fetch(path, { ...init, headers });
}

export async function getMe(): Promise<IntraUser> {
  const res = await fetchWithAuth(`${INTRA_BASE_URL}/v2/me`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetching user failed (${res.status}): ${text}`);
  }
  return (await res.json()) as IntraUser;
}

export async function searchUsers(
  query: string,
  opts?: { page?: number; per_page?: number }
): Promise<IntraSearchResult[]> {
  if (!query?.trim()) return [];
  const token = await getToken();
  if (!token) throw new Error("Missing token. Please login again.");

  const page = opts?.page ?? 1;
  const perPage = Math.min(Math.max(opts?.per_page ?? 30, 1), 100);
  const url = `${INTRA_BASE_URL}/v2/users?search[login]=${encodeURIComponent(
    query.trim()
  )}&page=${page}&per_page=${perPage}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Search failed (${res.status}) for "${query}" page=${page} per_page=${perPage}: ${text}`
    );
  }
  const users = (await res.json()) as IntraUser[];
  return users.map((u) => ({
    login: u.login,
    cdn_uri: u.image?.versions?.small ?? u.image?.link ?? "",
  }));
}

export async function getUser(loginOrId: string | number): Promise<IntraUser> {
  const path = `${INTRA_BASE_URL}/v2/users/${encodeURIComponent(
    String(loginOrId)
  )}`;
  const res = await fetchWithAuth(path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch user failed (${res.status}): ${text}`);
  }
  return (await res.json()) as IntraUser;
}
