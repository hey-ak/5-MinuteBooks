// API utility functions for simple auth
export function getAuthHeaders(): Record<string, string> {
  const user = localStorage.getItem('simple_user');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (user) {
    headers['Authorization'] = `Bearer ${user}`;
  }
  
  return headers;
}

export async function apiRequest(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}
