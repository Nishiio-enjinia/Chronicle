<template>
  <div class="admin-permissions">
    <div class="section-header">
      <h3>🔐 Permissions</h3>
    </div>

    <div class="permissions-tabs">
      <button 
        class="permission-tab" 
        :class="{ active: permissionView === 'users' }"
        @click="permissionView = 'users'"
      >
        Par utilisateur
      </button>
      <button 
        class="permission-tab" 
        :class="{ active: permissionView === 'groups' }"
        @click="permissionView = 'groups'"
      >
        Par groupe
      </button>
    </div>

    <!-- Permissions par utilisateur -->
    <div v-if="permissionView === 'users'" class="permissions-content">
      <div v-if="loading" class="loading">Chargement...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="users-permissions">
        <div v-for="user in users" :key="user._id" class="permission-card card">
          <div class="permission-header">
            <h4>{{ user.username }}</h4>
            <span class="user-role" :class="user.role">{{ user.role }}</span>
          </div>
          <div class="permissions-list">
            <div v-if="user.customPermissions && user.customPermissions.length > 0">
              <div v-for="(perm, index) in user.customPermissions" :key="index" class="permission-item">
                <span class="permission-resource">{{ perm.resource }}</span>
                <div class="permission-actions">
                  <span 
                    v-for="action in perm.actions" 
                    :key="action" 
                    class="action-badge"
                  >
                    {{ action }}
                  </span>
                </div>
                <button class="btn btn-danger btn-xs" @click="removeUserPermission(user._id, index)">
                  Supprimer
                </button>
              </div>
            </div>
            <div v-else class="no-permissions">
              Aucune permission personnalisée
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" @click="showAddUserPermission(user)">
            + Ajouter une permission
          </button>
        </div>
      </div>
    </div>

    <!-- Permissions par groupe -->
    <div v-if="permissionView === 'groups'" class="permissions-content">
      <div v-if="loadingGroups" class="loading">Chargement...</div>
      <div v-else-if="errorGroups" class="error">{{ errorGroups }}</div>
      <div v-else class="groups-permissions">
        <div v-for="group in groups" :key="group._id" class="permission-card card">
          <div class="permission-header">
            <h4>{{ group.name }}</h4>
            <span class="group-description">{{ group.description || 'Aucune description' }}</span>
          </div>
          <div class="permissions-list">
            <div v-if="group.permissions && group.permissions.length > 0">
              <div v-for="(perm, index) in group.permissions" :key="index" class="permission-item">
                <span class="permission-resource">{{ perm.resource }}</span>
                <div class="permission-actions">
                  <span 
                    v-for="action in perm.actions" 
                    :key="action" 
                    class="action-badge"
                  >
                    {{ action }}
                  </span>
                </div>
                <button class="btn btn-danger btn-xs" @click="removeGroupPermission(group._id, index)">
                  Supprimer
                </button>
              </div>
            </div>
            <div v-else class="no-permissions">
              Aucune permission
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" @click="showAddGroupPermission(group)">
            + Ajouter une permission
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Add Permission -->
    <div v-if="showPermissionModal" class="modal-overlay" @click.self="closePermissionModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ajouter une permission</h3>
          <button class="close-btn" @click="closePermissionModal">×</button>
        </div>
        <form @submit.prevent="savePermission" class="modal-form">
          <div class="form-group">
            <label class="form-label">Ressource *</label>
            <input type="text" class="form-input" v-model="permissionForm.resource" required placeholder="ex: changelogs, events" />
          </div>
          <div class="form-group">
            <label class="form-label">Actions *</label>
            <div class="actions-select">
              <label class="checkbox-label">
                <input type="checkbox" value="read" v-model="permissionForm.actions" />
                Lecture
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="write" v-model="permissionForm.actions" />
                Écriture
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="delete" v-model="permissionForm.actions" />
                Suppression
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="admin" v-model="permissionForm.actions" />
                Administration
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closePermissionModal">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="saving || permissionForm.actions.length === 0">
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
const groups = ref([]);
const loading = ref(false);
const loadingGroups = ref(false);
const error = ref('');
const errorGroups = ref('');
const permissionView = ref('users');
const showPermissionModal = ref(false);
const saving = ref(false);
const currentTarget = ref(null);
const targetType = ref('user'); // 'user' or 'group'

const permissionForm = ref({
  resource: '',
  actions: []
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
  loadingGroups.value = true;
  errorGroups.value = '';
  try {
    const response = await api.get('/admin/groups');
    groups.value = response.data;
  } catch (err) {
    errorGroups.value = err.response?.data?.error || 'Erreur lors du chargement';
  } finally {
    loadingGroups.value = false;
  }
};

const showAddUserPermission = (user) => {
  currentTarget.value = user;
  targetType.value = 'user';
  permissionForm.value = { resource: '', actions: [] };
  showPermissionModal.value = true;
};

const showAddGroupPermission = (group) => {
  currentTarget.value = group;
  targetType.value = 'group';
  permissionForm.value = { resource: '', actions: [] };
  showPermissionModal.value = true;
};

const removeUserPermission = async (userId, index) => {
  try {
    const user = users.value.find(u => u._id === userId);
    if (!user) return;
    
    user.customPermissions.splice(index, 1);
    await api.put(`/admin/users/${userId}`, {
      customPermissions: user.customPermissions
    });
    await fetchUsers();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la suppression';
  }
};

const removeGroupPermission = async (groupId, index) => {
  try {
    const group = groups.value.find(g => g._id === groupId);
    if (!group) return;
    
    group.permissions.splice(index, 1);
    await api.put(`/admin/groups/${groupId}`, {
      permissions: group.permissions
    });
    await fetchGroups();
  } catch (err) {
    errorGroups.value = err.response?.data?.error || 'Erreur lors de la suppression';
  }
};

const savePermission = async () => {
  if (permissionForm.value.actions.length === 0) return;
  
  saving.value = true;
  try {
    if (targetType.value === 'user') {
      const user = currentTarget.value;
      const customPermissions = [...(user.customPermissions || []), permissionForm.value];
      await api.put(`/admin/users/${user._id}`, { customPermissions });
      await fetchUsers();
    } else {
      const group = currentTarget.value;
      const permissions = [...(group.permissions || []), permissionForm.value];
      await api.put(`/admin/groups/${group._id}`, { permissions });
      await fetchGroups();
    }
    closePermissionModal();
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};

const closePermissionModal = () => {
  showPermissionModal.value = false;
  currentTarget.value = null;
  permissionForm.value = { resource: '', actions: [] };
};

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchGroups()]);
});
</script>

<style scoped>
.permissions-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.permission-tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.permission-tab:hover {
  color: var(--text-primary);
}

.permission-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.permission-card {
  margin-bottom: 1rem;
  border-left: 4px solid var(--primary-color);
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.permission-header h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.group-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.permissions-list {
  margin-bottom: 1rem;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
}

.permission-resource {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 150px;
}

.permission-actions {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.action-badge {
  padding: 0.25rem 0.5rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
}

.no-permissions {
  padding: 1rem;
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}

.actions-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>

