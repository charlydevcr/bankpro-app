import axios from 'axios';

// LÓGICA DE CONEXIÓN INTELIGENTE:
// 1. Si existe una variable de entorno en Vercel (VITE_API_URL), usa esa.
// 2. Si no existe (estás en tu Mac), usa localhost.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log("Conectando a:", baseURL); // Esto te ayudará a ver en la consola del navegador a dónde apunta

const api = axios.create({
  baseURL: baseURL,
});

export default api;