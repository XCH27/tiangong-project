/**
 * Token requests use the host's network transport when one is installed.
 * Electron supplies a proxy-aware Chromium session.fetch after app.ready; headless
 * runtimes keep the existing global fetch behavior.
 */
export type OAuthTokenFetcher = (url: string, init: RequestInit) => Promise<Response>

let tokenFetcher: OAuthTokenFetcher = (url, init) => globalThis.fetch(url, init)

export function setOAuthTokenFetcher(fetcher: OAuthTokenFetcher | null): void {
  tokenFetcher = fetcher ?? ((url, init) => globalThis.fetch(url, init))
}

export function fetchOAuthToken(url: string, init: RequestInit): Promise<Response> {
  return tokenFetcher(url, init)
}
