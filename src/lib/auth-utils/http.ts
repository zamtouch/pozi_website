/**
 * Lightweight HTTP helper for performing JSON requests.
 * 
 * Provides a simple wrapper around fetch that sets common options,
 * encodes payloads as JSON and returns both the HTTP status code and
 * response body.
 */

export interface HttpResponse {
  status: number;
  body: string;
}

/**
 * Perform an HTTP request and return the response.
 * 
 * @param method The HTTP method (GET, POST, PATCH, etc.)
 * @param url Fully qualified URL
 * @param payload Optional request body; will be JSON-encoded if not null
 * @param headers Additional HTTP headers to send
 * @returns Promise with [statusCode, body]
 */
export async function httpJson(
  method: string,
  url: string,
  payload: any = null,
  headers: string[] = []
): Promise<HttpResponse> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Parse custom headers
  headers.forEach(header => {
    const [key, ...valueParts] = header.split(':');
    if (key && valueParts.length > 0) {
      defaultHeaders[key.trim()] = valueParts.join(':').trim();
    }
  });

  const options: RequestInit = {
    method,
    headers: defaultHeaders,
    signal: AbortSignal.timeout(20000), // 20 second timeout
  };

  if (payload !== null) {
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);
    const body = await response.text();
    return {
      status: response.status,
      body,
    };
  } catch (error: any) {
    console.error('httpJson fetch error', { method, url, message: error?.message, cause: error?.cause });
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}



