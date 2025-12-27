export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('token');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // DO NOT throw → frontend must never crash
  if (res.status === 401) {
    return { __unauthorized: true };
  }

  return res.json();
}
