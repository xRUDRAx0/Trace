// Centralized configuration for TRACE frontend
export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
