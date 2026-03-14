const baseApiUrl = (import.meta.env.VITE_API_URL || 'https://c-transit-pink.vercel.app').replace(/\/$/, '');

export const AUTH_API_URL = `${baseApiUrl}/api/auth`;
