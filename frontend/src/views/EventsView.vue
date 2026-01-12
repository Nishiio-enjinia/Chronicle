<template>
  <div class="events-view">
    <div class="breadcrumb">
      <span class="breadcrumb-item">📋 Chronicle</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item active">Événements</span>
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
              v-model="eventsStore.filters.site"
              @change="handleFilterChange"
            >
              <option value="">Tous</option>
              <option v-for="site in sites" :key="site" :value="site">
                {{ site }}
              </option>
            </select>
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Type</label>
            <select 
              class="form-select-compact" 
              v-model="eventsStore.filters.type"
              @change="handleFilterChange"
            >
              <option value="">Tous</option>
              <option value="maintenance">Maintenance</option>
              <option value="intervention">Intervention</option>
              <option value="incident">Incident</option>
              <option value="announcement">Annonce</option>
            </select>
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Statut</label>
            <select 
              class="form-select-compact" 
              v-model="eventsStore.filters.status"
              @change="handleFilterChange"
            >
              <option value="">Tous</option>
              <option value="scheduled">Planifié</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div class="form-group-compact">
            <label class="form-label-compact">Date début</label>
            <input 
              type="date" 
              class="form-input-compact"
              v-model="eventsStore.filters.startDate"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="eventsStore.error" class="error">
      {{ eventsStore.error }}
    </div>

    <!-- Liste des événements -->
    <div v-if="eventsStore.loading" class="loading">
      Chargement...
    </div>
    <div v-else-if="eventsStore.events.length === 0" class="card">
      <p>Aucun événement trouvé avec ces filtres.</p>
    </div>
    <div v-else>
      <div 
        v-for="event in eventsStore.events" 
        :key="event._id"
        class="card event-card"
      >
        <div class="event-header">
          <div class="event-title-section">
            <div class="event-icon" :class="getEventIconClass(event.type)">{{ getEventIcon(event.type) }}</div>
            <h3>{{ event.title }}</h3>
            <span class="badge" :class="getTypeBadgeClass(event.type)">
              {{ getTypeLabel(event.type) }}
            </span>
            <span class="badge" :class="getStatusBadgeClass(event.status)">
              {{ getStatusLabel(event.status) }}
            </span>
            <span class="badge" :class="getImpactBadgeClass(event.impact)">
              ⚡ Impact: {{ getImpactLabel(event.impact) }}
            </span>
            <span class="site-badge">{{ event.site }}</span>
            <span v-if="event.application" class="app-badge">{{ event.application }}</span>
          </div>
          <div class="event-dates">
            <span class="date-item">
              <span class="date-label">📅</span>
              <span class="date-value">{{ formatDate(event.startDate) }}</span>
            </span>
            <span v-if="event.endDate" class="date-item">
              <span class="date-label">🏁</span>
              <span class="date-value">{{ formatDate(event.endDate) }}</span>
            </span>
          </div>
        </div>

        <div class="event-description">
          <p>{{ event.description }}</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          class="btn btn-secondary"
          @click="previousPage"
          :disabled="eventsStore.pagination.page === 1"
        >
          Précédent
        </button>
        <span>
          Page {{ eventsStore.pagination.page }} sur {{ eventsStore.pagination.pages }}
        </span>
        <button 
          class="btn btn-secondary"
          @click="nextPage"
          :disabled="eventsStore.pagination.page >= eventsStore.pagination.pages"
        >
          Suivant
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useEventsStore } from '../stores/events.js';
import { useChangelogsStore } from '../stores/changelogs.js';
import api from '../api/client.js';
import { format } from 'date-fns';

const eventsStore = useEventsStore();
const changelogsStore = useChangelogsStore();
const sites = ref([]);
const filtersCollapsed = ref(false);

const toggleFilters = () => {
  filtersCollapsed.value = !filtersCollapsed.value;
};

onMounted(async () => {
  await fetchSites();
  await eventsStore.fetchEvents();
});

const fetchSites = async () => {
  try {
    const response = await api.get('/sites');
    sites.value = response.data;
  } catch (error) {
    console.error('Error fetching sites:', error);
  }
};

const handleFilterChange = async () => {
  await eventsStore.fetchEvents();
};

const previousPage = async () => {
  if (eventsStore.pagination.page > 1) {
    eventsStore.setPage(eventsStore.pagination.page - 1);
    await eventsStore.fetchEvents();
  }
};

const nextPage = async () => {
  if (eventsStore.pagination.page < eventsStore.pagination.pages) {
    eventsStore.setPage(eventsStore.pagination.page + 1);
    await eventsStore.fetchEvents();
  }
};

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy à HH:mm');
};

const getTypeBadgeClass = (type) => {
  const classes = {
    maintenance: 'badge-warning',
    intervention: 'badge-primary',
    incident: 'badge-danger',
    announcement: 'badge-success'
  };
  return classes[type] || 'badge-primary';
};

const getTypeLabel = (type) => {
  const labels = {
    maintenance: 'Maintenance',
    intervention: 'Intervention',
    incident: 'Incident',
    announcement: 'Annonce'
  };
  return labels[type] || type;
};

const getStatusBadgeClass = (status) => {
  const classes = {
    scheduled: 'badge-primary',
    'in-progress': 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-danger'
  };
  return classes[status] || 'badge-primary';
};

const getStatusLabel = (status) => {
  const labels = {
    scheduled: 'Planifié',
    'in-progress': 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé'
  };
  return labels[status] || status;
};

const getImpactBadgeClass = (impact) => {
  const classes = {
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-warning',
    critical: 'badge-danger'
  };
  return classes[impact] || 'badge-primary';
};

const getImpactLabel = (impact) => {
  const labels = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    critical: 'Critique'
  };
  return labels[impact] || impact;
};

const getEventIcon = (type) => {
  const icons = {
    maintenance: '🔧',
    intervention: '🛠️',
    incident: '⚠️',
    announcement: '📢'
  };
  return icons[type] || '📅';
};

const getEventIconClass = (type) => {
  return `event-icon-${type}`;
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

.event-card {
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  border-left: 4px solid var(--primary-color);
}

.event-card:hover {
  border-left-width: 6px;
  transform: translateX(4px);
}

.event-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.event-title-section {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.event-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--background);
}

.event-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.site-badge,
.app-badge {
  font-weight: 600;
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.event-description {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  line-height: 1.7;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.event-dates {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-shrink: 0;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.date-label {
  font-size: 1rem;
  line-height: 1;
}

.date-value {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
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
  .event-dates {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

