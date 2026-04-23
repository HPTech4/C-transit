// Base API URL: Uses the environment variable VITE_API_URL if available, otherwise defaults to the production URL.
const baseApiUrl = (import.meta.env.VITE_API_URL || 'https://c-transit-pink.vercel.app').replace(/\/$/, '');

// Authentication API endpoint: Used for all authentication-related requests.
export const AUTH_API_URL = `${baseApiUrl}/api/auth`;
export const USER_API_URL = `${baseApiUrl}/api`;
