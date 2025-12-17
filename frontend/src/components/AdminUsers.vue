<template>
  <div class="admin-users">
    <div class="section-header">
      <h3>👥 Utilisateurs</h3>
      <button class="btn btn-primary" @click="showAddModal = true">
        + Ajouter un utilisateur
      </button>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="users.length === 0" class="empty-state">
      <p>Aucun utilisateur</p>
    </div>
    <div v-else class="users-list">
      <div v-for="user in users" :key="user._id" class="user-card card">
        <div class="user-header">
          <div>
            <h4>{{ user.username }}</h4>
            <span class="user-role" :class="user.role">{{ user.role }}</span>
          </div>
          <div class="user-actions">
            <button class="btn btn-secondary btn-sm" @click="editUser(user)">Modifier</button>
            <button class="btn btn-danger btn-sm" @click="deleteUser(user._id)">Supprimer</button>
          </div>
        </div>
        <div class="user-info">
          <div class="info-item">
            <span class="info-label">Groupes:</span>
            <span v-if="user.groups && user.groups.length > 0">
              <span v-for="group in user.groups" :key="group._id || group" class="group-badge">
                {{ typeof group === 'object' ? group.name : group }}
              </span>
            </span>
            <span v-else class="text-muted">Aucun groupe</span>
          </div>
          <div class="info-item">
            <span class="info-label">Statut:</span>
            <span :class="['status-badge', user.isActive ? 'active' : 'inactive']">
              {{ user.isActive ? '✓ Actif' : '✗ Inactif' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Add/Edit -->
    <div v-if="showAddModal || editingUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingUser ? 'Modifier' : 'Ajouter' }} un utilisateur</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveUser" class="modal-form">
          <div class="form-group">
            <label class="form-label">Nom d'utilisateur *</label>
            <input type="text" class="form-input" v-model="userForm.username" required />
          </div>
          <div class="form-group">
            <label class="form-label">{{ editingUser ? 'Nouveau mot de passe' : 'Mot de passe' }} *</label>
            <input type="password" class="form-input" v-model="userForm.password" :required="!editingUser" />
          </div>
          <div class="form-group">
            <label class="form-label">Rôle *</label>
            <select class="form-select" v-model="userForm.role" required>
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Groupes</label>
            <div class="groups-select">
              <label v-for="group in availableGroups" :key="group._id" class="checkbox-label">
                <input 
                  type="checkbox" 
                  :value="group._id" 
                  v-model="userForm.groups"
                />
                {{ group.name }}
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="userForm.isActive" />
              Actif
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/client.js';

const users = ref([]);
const availableGroups = ref([]);
const loading = ref(false);
const error = ref('');
const showAddModal = ref(false);
const editingUser = ref(null);
const saving = ref(false);

const userForm = ref({
  username: '',
  password: '',
  role: 'user',
  groups: [],
  isActive: true
});

const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/admin/users');
    users.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const fetchGroups = async () => {
  try {
    const response = await api.get('/admin/groups');
    availableGroups.value = response.data;
  } catch (err) {
    console.error('Error fetching groups:', err);
  }
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.value = {
    username: user.username,
    password: '',
    role: user.role,
    groups: user.groups?.map(g => g._id || g) || [],
    isActive: user.isActive
  };
  showAddModal.value = true;
};

const deleteUser = async (id) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
  
  try {
    await api.delete(`/admin/users/${id}`);
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la suppression';
  }
};

const saveUser = async () => {
  saving.value = true;
  try {
    const data = { ...userForm.value };
    if (editingUser.value && !data.password) {
      delete data.password;
    }
    
    if (editingUser.value) {
      await api.put(`/admin/users/${editingUser.value._id}`, data);
    } else {
      await api.post('/admin/users', data);
    }
    closeModal();
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingUser.value = null;
  userForm.value = {
    username: '',
    password: '',
    role: 'user',
    groups: [],
    isActive: true
  };
};

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchGroups()]);
});
</script>

<style scoped>
.user-card {
  border-left: 4px solid var(--primary-color);
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.user-header h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.user-role {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.user-role.admin {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger-color);
}

.user-role.user {
  background: rgba(96, 165, 250, 0.15);
  color: var(--primary-color);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.group-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  margin-right: 0.25rem;
}

.groups-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  max-height: 200px;
  overflow-y: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem;
}

.checkbox-label:hover {
  background: var(--surface-hover);
  border-radius: var(--radius-sm);
}

.text-muted {
  color: var(--text-muted);
  font-style: italic;
}
</style>

