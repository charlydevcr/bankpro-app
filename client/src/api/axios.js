// client/src/api/axios.js
import axios from 'axios';

// Configuración base para conectarnos al Backend
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

export default api;