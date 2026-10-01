import { UpstreamError } from '../../http/errors.js';

export class UberClient {
  constructor(
    private baseUrl: string,
    private tokenProvider: { getToken(): Promise<string> }
  ) {}

  async getOrder(resourceId: string): Promise<unknown> {
    const token = await this.tokenProvider.getToken();
    const url = `${this.baseUrl}/v2/eats/order/${resourceId}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: AbortSignal.timeout(5000)
    }).catch((e) => {
      throw new UpstreamError(`Network error fetching Uber order: ${e.message}`);
    });

    if (!res.ok) {
      throw new UpstreamError(`Uber Get Order failed with status ${res.status}`);
    }

    const data = await res.json();
    return data;
  }
}

