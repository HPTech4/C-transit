const baseApiUrl = (import.meta.env.VITE_API_URL || 'https://c-transit.onrender.com').replace(/\/$/, '');

export const AUTH_API_URL = `${baseApiUrl}/api/auth`;
