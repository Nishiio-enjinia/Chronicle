<template>
  <div id="app">
    <aside class="sidebar" :class="{ 'blurred': showAdminModal && isAuthenticated }">
      <div class="sidebar-content">
        <div class="logo-section">
          <div class="logo-icon">📋</div>
          <h1 class="logo">Chronicle</h1>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-link">
            <span class="nav-icon">📝</span>
            <span class="nav-text">Changelogs</span>
          </router-link>
          <router-link to="/events" class="nav-link">
            <span class="nav-icon">📅</span>
            <span class="nav-text">Événements</span>
          </router-link>
          <router-link to="/admin" class="nav-link">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Back Office</span>
          </router-link>
        </nav>
        <div class="sidebar-auth">
          <div v-if="!isAuthenticated" class="auth-section">
            <button class="auth-btn" @click="showLogin = true">
              <span class="auth-icon">🔐</span>
              <span class="auth-text">Connexion</span>
            </button>
          </div>
          <div v-else class="auth-section">
            <button class="auth-btn user-btn" @click="showAdminModal = true">
              <span class="user-icon">👤</span>
              <span class="user-name">{{ currentUser?.username }}</span>
            </button>
          </div>
        </div>
        <div class="sidebar-footer">
          <p>&copy; 2025 Chronicle</p>
        </div>
      </div>
      <!-- Overlay pour bloquer les interactions avec la sidebar -->
      <div v-if="showAdminModal && isAuthenticated" class="sidebar-overlay" @click.stop></div>
    </aside>
    
    <!-- Admin Panel Fullscreen -->
    <div v-if="showAdminModal && isAuthenticated" class="admin-fullscreen">
      <div class="admin-fullscreen-container">
        <div class="admin-header" :class="{ 'blurred': showDataManagementPanel }">
          <h2>⚙️ Administration</h2>
          <div class="admin-header-actions">
            <span class="admin-user-info">{{ currentUser?.username }}</span>
            <button class="close-btn" @click="showAdminModal = false" title="Fermer">×</button>
          </div>
        </div>
        <div class="admin-tabs" :class="{ 'blurred': showDataManagementPanel }">
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'data-sources' }"
            @click="activeTab = 'data-sources'"
          >
            📊 Sources de données
          </button>
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'users' }"
            @click="activeTab = 'users'"
          >
            👥 Utilisateurs
          </button>
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'permissions' }"
            @click="activeTab = 'permissions'"
          >
            🔐 Permissions
          </button>
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'public-pages' }"
            @click="activeTab = 'public-pages'"
          >
            🌐 Pages publiques
          </button>
          <button 
            class="admin-tab" 
            :class="{ active: activeTab === 'filters' }"
            @click="activeTab = 'filters'"
          >
            🔍 Filtres
          </button>
        </div>
        <div class="admin-content">
          <!-- Overlay modal pour le panneau de gestion des données -->
          <div v-if="showDataManagementPanel && selectedDataSource" class="data-management-overlay" @click.self="closeDataManagementPanel"></div>
          
          <!-- Panneau plein écran pour gérer les données Azure DevOps -->
          <div v-if="showDataManagementPanel && selectedDataSource" class="admin-section admin-fullscreen-panel">
            <div class="fullscreen-panel-header">
              <div class="modal-icon">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="4" fill="#0078D4"/>
                  <path d="M24 12L12 18V30L24 36L36 30V18L24 12Z" fill="white"/>
                  <path d="M24 16L16 20V28L24 32L32 28V20L24 16Z" fill="#0078D4"/>
                </svg>
              </div>
              <div class="panel-header-content">
                <h3>Gérer les données Azure DevOps</h3>
                <span class="panel-subtitle">{{ selectedDataSource.name }}</span>
              </div>
              <button class="btn btn-secondary btn-sm" @click="closeDataManagementPanel" title="Retour">
                ← Retour
              </button>
            </div>
            <AzureDevOpsDataModal 
              :sourceId="selectedDataSource._id"
              :sourceName="selectedDataSource.name || 'Source de données'"
              :fullscreen="true"
              @close="closeDataManagementPanel"
            />
          </div>
          <!-- Sources de données -->
          <div v-else-if="activeTab === 'data-sources'" class="admin-section">
            <AdminDataSources @open-data-management="openDataManagementPanel" />
          </div>
          <!-- Utilisateurs -->
          <div v-else-if="activeTab === 'users'" class="admin-section">
            <AdminUsers />
          </div>
          <!-- Permissions -->
          <div v-else-if="activeTab === 'permissions'" class="admin-section">
            <AdminPermissions />
          </div>
          <!-- Pages publiques -->
          <div v-else-if="activeTab === 'public-pages'" class="admin-section">
            <AdminPublicPages />
          </div>
          <!-- Filtres -->
          <div v-else-if="activeTab === 'filters'" class="admin-section">
            <AdminKeywordGroups />
          </div>
        </div>
        <div class="admin-footer" :class="{ 'blurred': showDataManagementPanel }">
          <button class="btn btn-secondary" @click="handleLogout">
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <div v-if="showLogin" class="login-modal" @click.self="showLogin = false">
      <div class="login-modal-content">
        <div class="login-header">
          <h2>Connexion</h2>
          <button class="close-btn" @click="showLogin = false">×</button>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Nom d'utilisateur</label>
            <input 
              type="text" 
              class="form-input"
              v-model="loginForm.username"
              required
              autocomplete="username"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <input 
              type="password" 
              class="form-input"
              v-model="loginForm.password"
              required
              autocomplete="current-password"
            />
          </div>
          <div v-if="loginError" class="error">
            {{ loginError }}
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loggingIn">
            {{ loggingIn ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
    
    <main class="main" v-if="!showAdminModal">
      <div class="container">
        <router-view />
      </div>
    </main>

    <!-- Notifications -->
    <NotificationToast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from './api/client.js';
import AdminDataSources from './components/AdminDataSources.vue';
import AdminUsers from './components/AdminUsers.vue';
import AdminPermissions from './components/AdminPermissions.vue';
import AdminPublicPages from './components/AdminPublicPages.vue';
import AdminKeywordGroups from './components/AdminKeywordGroups.vue';
import AzureDevOpsDataModal from './components/AzureDevOpsDataModal.vue';
import NotificationToast from './components/NotificationToast.vue';

const showLogin = ref(false);
const showAdminModal = ref(false);
const activeTab = ref('data-sources');
const isAuthenticated = ref(false);
const currentUser = ref(null);
const loggingIn = ref(false);
const loginError = ref('');
const loginForm = ref({
  username: '',
  password: ''
});
const showDataManagementPanel = ref(false);
const selectedDataSource = ref(null);

const checkAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    isAuthenticated.value = false;
    return;
  }

  try {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    isAuthenticated.value = true;
    currentUser.value = response.data.user;
  } catch (error) {
    localStorage.removeItem('token');
    isAuthenticated.value = false;
    currentUser.value = null;
  }
};

const handleLogin = async () => {
  loggingIn.value = true;
  loginError.value = '';

  try {
    const response = await api.post('/auth/login', loginForm.value);
    localStorage.setItem('token', response.data.token);
    isAuthenticated.value = true;
    currentUser.value = response.data.user;
    showLogin.value = false;
    loginForm.value = { username: '', password: '' };
  } catch (error) {
    loginError.value = error.response?.data?.error || 'Erreur de connexion';
  } finally {
    loggingIn.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  isAuthenticated.value = false;
  currentUser.value = null;
};

const openDataManagementPanel = (source) => {
  selectedDataSource.value = source;
  showDataManagementPanel.value = true;
};

const closeDataManagementPanel = () => {
  showDataManagementPanel.value = false;
  selectedDataSource.value = null;
  // S'assurer qu'on est sur l'onglet Sources de données
  if (activeTab.value !== 'data-sources') {
    activeTab.value = 'data-sources';
  }
};

onMounted(() => {
  checkAuth();
});
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, var(--surface) 0%, #1e293b 100%);
  border-right: 2px solid var(--border-color);
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  transition: filter 0.3s ease;
}

.sidebar.blurred {
  filter: blur(4px);
  pointer-events: none;
}

.sidebar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 101;
  pointer-events: auto;
  cursor: not-allowed;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.logo-icon {
  font-size: 2rem;
  line-height: 1;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.nav-link:hover {
  color: var(--primary-light);
  background: var(--background);
  transform: translateX(4px);
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(96, 165, 250, 0.4);
}

.nav-icon {
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
}

.nav-text {
  white-space: nowrap;
}

.sidebar-auth {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.auth-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-btn:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.user-btn {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-color: rgba(96, 165, 250, 0.3);
}

.user-btn:hover {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
  border-color: var(--primary-color);
}

.user-icon {
  font-size: 1rem;
}

.user-name {
  flex: 1;
  text-align: left;
}

.auth-icon {
  font-size: 1rem;
}

.auth-text {
  flex: 1;
  text-align: left;
}

.login-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.login-modal-content {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.login-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--background);
  color: var(--text-primary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.admin-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  width: calc(100% - 280px);
}

.admin-fullscreen-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid var(--border-color);
  background: linear-gradient(135deg, var(--surface) 0%, #1e293b 100%);
  flex-shrink: 0;
  transition: filter 0.3s ease;
  position: relative;
}

.admin-header.blurred {
  filter: blur(4px);
  pointer-events: none;
}

.admin-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .admin-header {
    padding: 0.75rem 1rem;
  }
  
  .admin-header h2 {
    font-size: 1.125rem;
  }
  
  .admin-user-info {
    display: none;
  }
}

.admin-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-user-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-bottom: 2px solid var(--border-color);
  background: var(--background);
  overflow-x: auto;
  flex-shrink: 0;
  transition: filter 0.3s ease;
  position: relative;
}

.admin-tabs.blurred {
  filter: blur(4px);
  pointer-events: none;
}

.admin-tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .admin-tabs {
    padding: 0.5rem 1rem;
    gap: 0.25rem;
  }
  
  .admin-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
}

.admin-tab:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.admin-tab.active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(96, 165, 250, 0.3);
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  min-height: 0;
  position: relative;
}

.admin-section {
  min-height: 400px;
}

.data-management-overlay {
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 2100;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .data-management-overlay {
    left: 70px;
  }
}

.admin-fullscreen-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  bottom: 0;
  z-index: 2101;
  background: var(--surface);
}

@media (max-width: 768px) {
  .admin-fullscreen-panel {
    left: 70px;
  }
}

.fullscreen-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid var(--border-color);
  background: var(--background);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .fullscreen-panel-header {
    padding: 0.75rem 1rem;
    flex-wrap: nowrap;
  }
  
  .fullscreen-panel-header .modal-icon {
    width: 24px;
    height: 24px;
  }
  
  .fullscreen-panel-header h3 {
    font-size: 1rem;
  }
  
  .panel-subtitle {
    font-size: 0.75rem;
  }
  
  .fullscreen-panel-header .btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
}

.fullscreen-panel-header .modal-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.panel-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.fullscreen-panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-subtitle {
  color: var(--text-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .panel-header-content {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  
  .fullscreen-panel-header h3 {
    font-size: 0.875rem;
    margin: 0;
  }
  
  .panel-subtitle {
    font-size: 0.75rem;
  }
}

.admin-fullscreen-panel .azure-devops-data-modal {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.admin-footer {
  padding: 1.5rem 2rem;
  border-top: 2px solid var(--border-color);
  background: var(--background);
  display: flex;
  justify-content: flex-end;
  transition: filter 0.3s ease;
  position: relative;
}

.admin-footer.blurred {
  filter: blur(4px);
  pointer-events: none;
}

.main {
  margin-left: 280px;
  min-height: 100vh;
  padding: 2.5rem 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .logo-section {
    justify-content: center;
  }

  .logo {
    display: none;
  }

  .nav-text,
  .auth-text,
  .user-name {
    display: none;
  }

  .nav-link,
  .auth-btn {
    justify-content: center;
    padding: 0.875rem;
  }

  .user-info {
    justify-content: center;
  }

  .sidebar-footer p {
    font-size: 0.625rem;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .main {
    margin-left: 70px;
  }

  .admin-fullscreen {
    margin-left: 70px;
    width: calc(100% - 70px);
  }
}
</style>













