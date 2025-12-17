<template>
  <div class="changelogs-view">
    <div class="breadcrumb">
      <span class="breadcrumb-item">📋 Chronicle</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">Changelogs</span>
    </div>

    <!-- Filtres -->
    <div class="filters-compact">
      <div class="filters-header-compact" @click="toggleFilters">
        <span class="filters-icon">🔍</span>
        <span class="filters-label">Filtres</span>
        <button class="collapse-btn" :class="{ 'collapsed': filtersCollapsed }">
          <span v-if="filtersCollapsed">▼</span>
          <span v-else>▲</span>
        </button>
      </div>
      <div class="filters-content-compact" :class="{ 'collapsed': filtersCollapsed }">
        <div class="filters-row">
          <div class="form-group-compact">
            <label class="form-label-compact">Site</label>
            <select 
              class="form-select-compact" 
              v-model="changelogsStore.filters.site"
              @change="handleFilterChange"
            >
              <option value="">Tous</option>
              <option v-for="site in changelogsStore.sites" :key="site" :value="site">
                {{ site }}
              </option>
            </select>
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Application</label>
            <select 
              class="form-select-compact" 
              v-model="changelogsStore.filters.application"
              @change="handleFilterChange"
            >
              <option value="">Toutes</option>
              <option v-for="app in changelogsStore.applications" :key="app" :value="app">
                {{ app }}
              </option>
            </select>
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Date début</label>
            <input 
              type="date" 
              class="form-input-compact"
              v-model="changelogsStore.filters.startDate"
              @change="handleFilterChange"
            />
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Date fin</label>
            <input 
              type="date" 
              class="form-input-compact"
              v-model="changelogsStore.filters.endDate"
              @change="handleFilterChange"
            />
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Source</label>
            <select 
              class="form-select-compact" 
              v-model="changelogsStore.filters.source"
              @change="handleFilterChange"
            >
              <option value="">Toutes</option>
              <option value="n8n">Auto</option>
              <option value="manual">Manuel</option>
            </select>
          </div>

          <div class="form-group-compact">
            <button class="btn btn-secondary btn-xs" @click.stop="resetFilters">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="changelogsStore.error" class="error">
      {{ changelogsStore.error }}
    </div>

    <!-- Liste des changelogs -->
    <div v-if="changelogsStore.loading" class="loading">
      Chargement...
    </div>
    <div v-else-if="changelogsStore.changelogs.length === 0" class="card">
      <p>Aucun changelog trouvé avec ces filtres.</p>
    </div>
    <div v-else>
      <div 
        v-for="changelog in changelogsStore.changelogs" 
        :key="changelog._id"
        class="card changelog-card"
      >
        <div class="changelog-header">
          <div class="changelog-title-section">
            <div class="changelog-icon">🚀</div>
            <div>
              <h3>{{ changelog.application }}</h3>
              <p class="changelog-meta">
                <span class="badge badge-primary">{{ changelog.site }}</span>
                <span class="version-badge">v{{ changelog.version }}</span>
                <span class="build-badge">#{{ changelog.buildNumber }}</span>
                <span class="badge" :class="getSourceBadgeClass(changelog.source)">
                  {{ changelog.source === 'n8n' ? '🤖 Auto' : '✋ Manuel' }}
                </span>
              </p>
            </div>
          </div>
          <div class="changelog-date">
            <span class="date-icon">📅</span>
            {{ formatDate(changelog.buildDate) }}
          </div>
        </div>

        <div class="changelog-changes">
          <h4>✨ Modifications</h4>
          <ul class="changes-list">
            <li v-for="(change, index) in changelog.changes" :key="index" class="change-item">
              <span class="badge" :class="getChangeTypeBadgeClass(change.type)">
                {{ getChangeTypeLabel(change.type) }}
              </span>
              <span class="change-description">{{ change.description }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="pagination">
        <button 
          class="btn btn-secondary"
          @click="previousPage"
          :disabled="changelogsStore.pagination.page === 1"
        >
          Précédent
        </button>
        <span>
          Page {{ changelogsStore.pagination.page }} sur {{ changelogsStore.pagination.pages }}
        </span>
        <button 
          class="btn btn-secondary"
          @click="nextPage"
          :disabled="changelogsStore.pagination.page >= changelogsStore.pagination.pages"
        >
          Suivant
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useChangelogsStore } from '../stores/changelogs.js';
import { format } from 'date-fns';

const changelogsStore = useChangelogsStore();
const filtersCollapsed = ref(false);

const toggleFilters = () => {
  filtersCollapsed.value = !filtersCollapsed.value;
};

onMounted(async () => {
  await changelogsStore.fetchSites();
  await changelogsStore.fetchApplications();
  await changelogsStore.fetchChangelogs();
});

watch(() => changelogsStore.filters.site, async () => {
  await changelogsStore.fetchApplications();
});

const handleFilterChange = async () => {
  await changelogsStore.fetchChangelogs();
};

const resetFilters = async () => {
  changelogsStore.filters = {
    site: '',
    application: '',
    startDate: '',
    endDate: '',
    source: ''
  };
  await changelogsStore.fetchChangelogs();
};

const previousPage = async () => {
  if (changelogsStore.pagination.page > 1) {
    changelogsStore.setPage(changelogsStore.pagination.page - 1);
    await changelogsStore.fetchChangelogs();
  }
};

const nextPage = async () => {
  if (changelogsStore.pagination.page < changelogsStore.pagination.pages) {
    changelogsStore.setPage(changelogsStore.pagination.page + 1);
    await changelogsStore.fetchChangelogs();
  }
};

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy à HH:mm');
};

const getSourceBadgeClass = (source) => {
  return source === 'n8n' ? 'badge-success' : 'badge-warning';
};

const getChangeTypeBadgeClass = (type) => {
  const classes = {
    feature: 'badge-success',
    fix: 'badge-primary',
    update: 'badge-primary',
    security: 'badge-danger',
    breaking: 'badge-danger'
  };
  return classes[type] || 'badge-primary';
};

const getChangeTypeLabel = (type) => {
  const labels = {
    feature: 'Nouvelle fonctionnalité',
    fix: 'Correction',
    update: 'Mise à jour',
    security: 'Sécurité',
    breaking: 'Changement majeur'
  };
  return labels[type] || type;
};
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb-item {
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: 600;
}

.breadcrumb-separator {
  color: var(--text-muted);
}

.filters-compact {
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}

.filters-header-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  padding: 0.25rem 0;
  margin-bottom: 0.75rem;
}

.filters-header-compact:hover {
  opacity: 0.8;
}

.filters-icon {
  font-size: 1rem;
}

.filters-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.collapse-btn {
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
}

.collapse-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.collapse-btn.collapsed {
  transform: rotate(180deg);
}

.filters-content-compact {
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 200px;
  opacity: 1;
}

.filters-content-compact.collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.form-group-compact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
  flex: 1;
}

.form-label-compact {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input-compact,
.form-select-compact {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  background-color: var(--background);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-input-compact:focus,
.form-select-compact:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
}

.btn-xs {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  white-space: nowrap;
}

.changelog-card {
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  border-left: 4px solid var(--primary-color);
}

.changelog-card:hover {
  border-left-color: var(--primary-dark);
  transform: translateX(4px);
}

.changelog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-light);
}

.changelog-title-section {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex: 1;
}

.changelog-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.changelog-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.changelog-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.version-badge,
.build-badge {
  font-weight: 600;
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  font-family: 'Courier New', monospace;
  border: 1px solid var(--border-color);
}

.changelog-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  white-space: nowrap;
  font-weight: 500;
}

.date-icon {
  font-size: 1rem;
}

.changelog-changes h4 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.changes-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.change-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.875rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.change-item:hover {
  background: var(--surface-hover);
  border-left-color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.change-description {
  flex: 1;
  color: var(--text-primary);
  line-height: 1.6;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3rem;
  padding: 1.5rem;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
}

.pagination span {
  font-weight: 600;
  color: var(--text-secondary);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

@media (max-width: 768px) {
  .changelog-header {
    flex-direction: column;
    gap: 1rem;
  }

  .changelog-date {
    align-self: flex-start;
  }

  .filters-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>

