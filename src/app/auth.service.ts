import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class AuthService {
    AUTH_SERVER = 'http://localhost:9000';
    // API calls go through the nginx reverse proxy (same origin).
    // nginx forwards /api/* and /actuator/* to resource-server.
    // When resource-server is upgraded to HTTPS+mTLS, only nginx.conf needs updating.
    RESOURCE_SERVER = '';
    OPA_SERVER = 'http://localhost:8181';
    CLIENT_ID = 'frontend-client';
    REDIRECT_URI = new URL('/callback', window.location.origin).href;
    SCOPES = 'openid profile email resource:read';
    TOKEN_KEYS = ['access_token', 'id_token', 'refresh_token', 'expires_in', 'token_expiry_ts'];

    // ═══════════════════════════════════════════════════════════════════
    //  PKCE HELPERS
    // ═══════════════════════════════════════════════════════════════════

    generateCodeVerifier() {
        const array = new Uint8Array(64);
        crypto.getRandomValues(array);
        return this.base64urlEncode(array);
    }

    async generateCodeChallenge(verifier: any) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return this.base64urlEncode(new Uint8Array(digest));
    }

    base64urlEncode(buffer: any) {
        let str = '';
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    base64urlDecode(str: any) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        try {
            return decodeURIComponent(
                atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
        } catch {
            return atob(str);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  JWT HELPERS
    // ═══════════════════════════════════════════════════════════════════

    decodeJwt(token: any) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return {
                header: JSON.parse(this.base64urlDecode(parts[0])),
                payload: JSON.parse(this.base64urlDecode(parts[1])),
                signature: parts[2],
                raw: parts
            };
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TOKEN STORAGE (sessionStorage — demo only)
    // ═══════════════════════════════════════════════════════════════════

    saveTokens(data: any) {
        const expiryTs = Date.now() + (data.expires_in || 3600) * 1000;
        sessionStorage.setItem('access_token', data.access_token || '');
        sessionStorage.setItem('id_token', data.id_token || '');
        sessionStorage.setItem('refresh_token', data.refresh_token || '');
        sessionStorage.setItem('expires_in', String(data.expires_in || 3600));
        sessionStorage.setItem('token_expiry_ts', String(expiryTs));
        sessionStorage.setItem('token_issued_ts', String(Date.now()));
    }

    clearTokens() {
        this.TOKEN_KEYS.forEach(k => sessionStorage.removeItem(k));
        sessionStorage.removeItem('token_issued_ts');
    }

    getAccessToken() {
        return sessionStorage.getItem('access_token') || null;
    }

    isAuthenticated() {
        const token = this.getAccessToken();
        if (!token) return false;
        const expiry = parseInt(sessionStorage.getItem('token_expiry_ts') || '0', 10);
        return expiry > Date.now();
    }



    // ═══════════════════════════════════════════════════════════════════
    //  OAUTH2 PKCE FLOW
    // ═══════════════════════════════════════════════════════════════════

    async startLogin() {
        const verifier = this.generateCodeVerifier();
        const challenge = await this.generateCodeChallenge(verifier);
        const state = this.base64urlEncode(crypto.getRandomValues(new Uint8Array(16)));

        sessionStorage.setItem('pkce_verifier', verifier);
        sessionStorage.setItem('oauth_state', state);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
            scope: this.SCOPES,
            state: state,
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });
        console.log("Redirecting to Auth Server");
        window.location.href = `${this.AUTH_SERVER}/oauth2/authorize?${params}`;
    }

    async handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        if (error) {
            sessionStorage.removeItem('pkce_verifier');
            sessionStorage.removeItem('oauth_state');
            window.location.replace('/');
            return;
        }

        if (!code) {
            window.location.replace('/');
            return;
        }

        const savedState = sessionStorage.getItem('oauth_state');
        const codeVerifier = sessionStorage.getItem('pkce_verifier');

        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('pkce_verifier');

        if (savedState && state !== savedState) {
            console.error('[OAuth2] State mismatch — possible CSRF attack.');
            window.location.replace('/');
            return;
        }

        try {
            console.log("Exchanging code for tokens...")
            // Generate DPoP proof for token endpoint
            const tokenUrl = `${this.AUTH_SERVER}/oauth2/token`;
            // const dpopProof = await this.generateDPoPProof('POST', tokenUrl);

            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.CLIENT_ID,
                redirect_uri: this.REDIRECT_URI,
                code: code,
                code_verifier: codeVerifier || '',
            });

            const resp = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    // 'DPoP': dpopProof
                },
                body: body.toString(),
            });

            if (!resp.ok) {
                const text = await resp.text();
                console.error('[OAuth2] Token exchange failed:', text);
                window.location.replace('/');
                return;
            }

            const data = await resp.json();
            this.saveTokens(data);
            console.log(`Tokens received · ${new Date().toLocaleTimeString()}`);
            window.location.replace('/');
        } catch (err) {
            console.error('[OAuth2] Token exchange error:', err);
            window.location.replace('/');
        }
    }

    logout() {
        const token = this.getAccessToken();
        const idToken = sessionStorage.getItem('id_token');
        this.clearTokens();

        if (token && idToken) {
            const params = new URLSearchParams({
                id_token_hint: idToken,
                post_logout_redirect_uri: window.location.origin,
            });
            window.location.href = `${this.AUTH_SERVER}/connect/logout?${params}`;
        }
    }

}