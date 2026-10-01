export class UberTokenProvider {
  private currentToken: string | null = null;
  private expiresAt: number = 0;
  private inflightPromise: Promise<string> | null = null;

  constructor(
    private authUrl: string,
    private clientId: string,
    private clientSecret: string,
    private scope: string
  ) {}

  async getToken(): Promise<string> {
    if (this.currentToken && Date.now() < this.expiresAt) {
      return this.currentToken;
    }

    if (this.inflightPromise) {
      return this.inflightPromise;
    }

    this.inflightPromise = this.fetchNewToken().finally(() => {
      this.inflightPromise = null;
    });

    return this.inflightPromise;
  }

  private async fetchNewToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('grant_type', 'client_credentials');
    params.append('scope', this.scope);

    const res = await fetch(this.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!res.ok) {
      throw new Error(`Uber auth failed: ${res.status}`);
    }

    const data = await res.json() as { access_token: string, expires_in: number };
    this.currentToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.currentToken;
  }
}

