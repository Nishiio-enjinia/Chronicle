import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne pas recharger automatiquement la page, laisser les composants gérer l'affichage
      // Le token sera supprimé mais on laisse l'utilisateur voir le message d'erreur
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;














