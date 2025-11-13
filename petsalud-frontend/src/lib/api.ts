export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type Options = Omit<RequestInit, 'headers'> & {
  token?: string | null;
  headers?: Record<string, string>;
};

export async function apiFetch<T = unknown>(
  path: string,
  { token, headers, ...init }: Options = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : (null as unknown as T);
  
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (isJson && (data as any)?.error) || res.statusText || 'Error de red';
    throw new Error(msg);
  }
  return data as T;
}
