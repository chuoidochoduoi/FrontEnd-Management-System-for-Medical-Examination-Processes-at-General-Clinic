const API_URL = import.meta.env.VITE_API_URL;

export async function login(payload) {
    // Replace with real API integration; kept small and injectable for tests
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    let data = null;

    try {data = await res.json();
    } catch {data = null;}

    if (!res.ok) {
        throw new Error(data?.message || 'Authentication failed');
    }

    return data;
}
export default { login };
