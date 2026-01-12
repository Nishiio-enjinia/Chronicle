<template>
  <div class="azure-devops-data-modal" :class="{ 'fullscreen': fullscreen }">
    <div v-if="!fullscreen" class="modal-header">
      <div class="modal-header-content">
        <div class="modal-icon">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="4" fill="#0078D4"/>
            <path d="M24 12L12 18V30L24 36L36 30V18L24 12Z" fill="white"/>
            <path d="M24 16L16 20V28L24 32L32 28V20L24 16Z" fill="#0078D4"/>
          </svg>
        </div>
        <h3>Gérer les données Azure DevOps</h3>
        <p class="modal-subtitle">{{ sourceName }}</p>
      </div>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="modal-content">
      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span class="tab-count">({{ getTabCount(tab.id) }})</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">Chargement...</div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <!-- Content -->
      <div v-else class="tab-content">
        <!-- Projets -->
        <div v-if="activeTab === 'projects'" class="data-list">
          <!-- Barre d'actions groupées -->
          <div v-if="selectedItems.projects.value.size > 0" class="bulk-actions-bar">
            <div class="bulk-actions-info">
              <strong>{{ selectedItems.projects.value.size }}</strong> élément(s) sélectionné(s)
            </div>
            <div class="bulk-actions-buttons">
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('projects', true)">
                Rendre visible
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('projects', false)">
                Masquer
              </button>
              <button class="btn btn-secondary btn-sm" @click="showBulkRenameModal('projects')">
                Renommer
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSave('projects')">
                Enregistrer les sélectionnés
              </button>
              <button class="btn btn-ghost btn-sm" @click="clearSelection('projects')">
                Annuler la sélection
              </button>
            </div>
          </div>
          
          <div class="list-header">
            <div class="search-wrapper">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher un projet..."
                v-model="searchProjects"
              />
              <span v-if="isSearchingProjects" class="search-loading">🔍</span>
              <label class="exclude-checkbox" title="Mode exclusion : afficher les éléments qui ne correspondent pas">
                <input 
                  type="checkbox" 
                  v-model="excludeProjects"
                />
                <span>Exclure</span>
              </label>
            </div>
            <div class="header-actions">
              <label class="select-all-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected('projects')"
                  :indeterminate="isIndeterminate('projects')"
                  @change="toggleSelectAll('projects')"
                />
                <span>Tout sélectionner</span>
              </label>
              <button class="btn btn-primary btn-sm" @click="saveAll('projects')" :disabled="saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </div>
          <div class="data-items">
            <!-- Section Éléments visibles -->
            <div v-if="visibleProjects.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('projects', 'visible')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.projects.visible.value }">▼</span>
                <span class="collapse-title">Éléments visibles ({{ visibleProjects.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.projects.visible.value">
                <div 
                  v-for="project in visibleProjects" 
                  :key="project._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('projects', project._id) }"
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('projects', project._id)"
                        @change="toggleSelection('projects', project._id)"
                        @click.stop
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="project.isVisible"
                        @change="markDirty('projects', project)"
                        @click.stop
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="project.name"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="project.displayName"
                        @input="markDirty('projects', project)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Description</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="project.description || 'Aucune description'"
                        disabled
                        @click.stop
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Éléments non visibles -->
            <div v-if="hiddenProjects.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('projects', 'hidden')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.projects.hidden.value }">▼</span>
                <span class="collapse-title">Éléments non visibles ({{ hiddenProjects.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.projects.hidden.value">
                <div 
                  v-for="project in hiddenProjects" 
                  :key="project._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('projects', project._id) }"
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('projects', project._id)"
                        @change="toggleSelection('projects', project._id)"
                        @click.stop
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="project.isVisible"
                        @change="markDirty('projects', project)"
                        @click.stop
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="project.name"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="project.displayName"
                        @input="markDirty('projects', project)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Description</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="project.description || 'Aucune description'"
                        disabled
                        @click.stop
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pipelines -->
        <div v-if="activeTab === 'pipelines'" class="data-list">
          <!-- Barre d'actions groupées -->
          <div v-if="selectedItems.pipelines.value.size > 0" class="bulk-actions-bar">
            <div class="bulk-actions-info">
              <strong>{{ selectedItems.pipelines.value.size }}</strong> élément(s) sélectionné(s)
            </div>
            <div class="bulk-actions-buttons">
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('pipelines', true)">
                Rendre visible
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('pipelines', false)">
                Masquer
              </button>
              <button class="btn btn-secondary btn-sm" @click="showBulkRenameModal('pipelines')">
                Renommer
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSave('pipelines')">
                Enregistrer les sélectionnés
              </button>
              <button class="btn btn-ghost btn-sm" @click="clearSelection('pipelines')">
                Annuler la sélection
              </button>
            </div>
          </div>
          
          <div class="list-header">
            <div class="search-wrapper">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher un pipeline..."
                v-model="searchPipelines"
              />
              <span v-if="isSearchingPipelines" class="search-loading">🔍</span>
              <label class="exclude-checkbox" title="Mode exclusion : afficher les éléments qui ne correspondent pas">
                <input 
                  type="checkbox" 
                  v-model="excludePipelines"
                />
                <span>Exclure</span>
              </label>
            </div>
            <select class="form-select" v-model="filterProjectPipeline" @change="loadPipelines">
              <option value="">Tous les projets</option>
              <option v-for="project in projects" :key="project._id" :value="project.projectId">
                {{ project.name }}
              </option>
            </select>
            <div class="header-actions">
              <label class="select-all-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected('pipelines')"
                  :indeterminate="isIndeterminate('pipelines')"
                  @change="toggleSelectAll('pipelines')"
                />
                <span>Tout sélectionner</span>
              </label>
              <button class="btn btn-primary btn-sm" @click="saveAll('pipelines')" :disabled="saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </div>
          <div class="data-items">
            <!-- Section Éléments visibles -->
            <div v-if="visiblePipelines.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('pipelines', 'visible')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.pipelines.visible.value }">▼</span>
                <span class="collapse-title">Éléments visibles ({{ visiblePipelines.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.pipelines.visible.value">
                <div 
                  v-for="pipeline in visiblePipelines" 
                  :key="pipeline._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('pipelines', pipeline._id) }"
                  @click.stop
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('pipelines', pipeline._id)"
                        @change="toggleSelection('pipelines', pipeline._id)"
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="pipeline.isVisible"
                        @change="markDirty('pipelines', pipeline)"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Projet</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="pipeline.projectName"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="pipeline.name"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="pipeline.displayName"
                        @input="markDirty('pipelines', pipeline)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Éléments non visibles -->
            <div v-if="hiddenPipelines.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('pipelines', 'hidden')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.pipelines.hidden.value }">▼</span>
                <span class="collapse-title">Éléments non visibles ({{ hiddenPipelines.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.pipelines.hidden.value">
                <div 
                  v-for="pipeline in hiddenPipelines" 
                  :key="pipeline._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('pipelines', pipeline._id) }"
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('pipelines', pipeline._id)"
                        @change="toggleSelection('pipelines', pipeline._id)"
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="pipeline.isVisible"
                        @change="markDirty('pipelines', pipeline)"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Projet</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="pipeline.projectName"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="pipeline.name"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="pipeline.displayName"
                        @input="markDirty('pipelines', pipeline)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Repositories -->
        <div v-if="activeTab === 'repositories'" class="data-list">
          <!-- Barre d'actions groupées -->
          <div v-if="selectedItems.repositories.value.size > 0" class="bulk-actions-bar">
            <div class="bulk-actions-info">
              <strong>{{ selectedItems.repositories.value.size }}</strong> élément(s) sélectionné(s)
            </div>
            <div class="bulk-actions-buttons">
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('repositories', true)">
                Rendre visible
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('repositories', false)">
                Masquer
              </button>
              <button class="btn btn-secondary btn-sm" @click="showBulkRenameModal('repositories')">
                Renommer
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSave('repositories')">
                Enregistrer les sélectionnés
              </button>
              <button class="btn btn-ghost btn-sm" @click="clearSelection('repositories')">
                Annuler la sélection
              </button>
            </div>
          </div>
          
          <div class="list-header">
            <div class="search-wrapper">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher un repository..."
                v-model="searchRepositories"
              />
              <span v-if="isSearchingRepositories" class="search-loading">🔍</span>
              <label class="exclude-checkbox" title="Mode exclusion : afficher les éléments qui ne correspondent pas">
                <input 
                  type="checkbox" 
                  v-model="excludeRepositories"
                />
                <span>Exclure</span>
              </label>
            </div>
            <select class="form-select" v-model="filterProjectRepository" @change="loadRepositories">
              <option value="">Tous les projets</option>
              <option v-for="project in projects" :key="project._id" :value="project.projectId">
                {{ project.name }}
              </option>
            </select>
            <div class="header-actions">
              <label class="select-all-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected('repositories')"
                  :indeterminate="isIndeterminate('repositories')"
                  @change="toggleSelectAll('repositories')"
                />
                <span>Tout sélectionner</span>
              </label>
              <button class="btn btn-primary btn-sm" @click="saveAll('repositories')" :disabled="saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </div>
          <div class="data-items">
            <!-- Section Éléments visibles -->
            <div v-if="visibleRepositories.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('repositories', 'visible')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.repositories.visible.value }">▼</span>
                <span class="collapse-title">Éléments visibles ({{ visibleRepositories.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.repositories.visible.value">
                <div 
                  v-for="repo in visibleRepositories" 
                  :key="repo._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('repositories', repo._id) }"
                  @click.stop
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('repositories', repo._id)"
                        @change="toggleSelection('repositories', repo._id)"
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="repo.isVisible"
                        @change="markDirty('repositories', repo)"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Projet</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="repo.projectName"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="repo.name"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="repo.displayName"
                        @input="markDirty('repositories', repo)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Éléments non visibles -->
            <div v-if="hiddenRepositories.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('repositories', 'hidden')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.repositories.hidden.value }">▼</span>
                <span class="collapse-title">Éléments non visibles ({{ hiddenRepositories.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.repositories.hidden.value">
                <div 
                  v-for="repo in hiddenRepositories" 
                  :key="repo._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('repositories', repo._id) }"
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('repositories', repo._id)"
                        @change="toggleSelection('repositories', repo._id)"
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="repo.isVisible"
                        @change="markDirty('repositories', repo)"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Projet</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="repo.projectName"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="repo.name"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="repo.displayName"
                        @input="markDirty('repositories', repo)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Utilisateurs -->
        <div v-if="activeTab === 'users'" class="data-list">
          <!-- Barre d'actions groupées -->
          <div v-if="selectedItems.users.value.size > 0" class="bulk-actions-bar">
            <div class="bulk-actions-info">
              <strong>{{ selectedItems.users.value.size }}</strong> élément(s) sélectionné(s)
            </div>
            <div class="bulk-actions-buttons">
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('users', true)">
                Rendre visible
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSetVisible('users', false)">
                Masquer
              </button>
              <button class="btn btn-secondary btn-sm" @click="showBulkRenameModal('users')">
                Renommer
              </button>
              <button class="btn btn-secondary btn-sm" @click="bulkSave('users')">
                Enregistrer les sélectionnés
              </button>
              <button class="btn btn-ghost btn-sm" @click="clearSelection('users')">
                Annuler la sélection
              </button>
            </div>
          </div>
          
          <div class="list-header">
            <div class="search-wrapper">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher un utilisateur..."
                v-model="searchUsers"
              />
              <span v-if="isSearchingUsers" class="search-loading">🔍</span>
              <label class="exclude-checkbox" title="Mode exclusion : afficher les éléments qui ne correspondent pas">
                <input 
                  type="checkbox" 
                  v-model="excludeUsers"
                />
                <span>Exclure</span>
              </label>
            </div>
            <div class="header-actions">
              <label class="select-all-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected('users')"
                  :indeterminate="isIndeterminate('users')"
                  @change="toggleSelectAll('users')"
                />
                <span>Tout sélectionner</span>
              </label>
              <button class="btn btn-primary btn-sm" @click="saveAll('users')" :disabled="saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </div>
          <div class="data-items">
            <!-- Section Éléments visibles -->
            <div v-if="visibleUsers.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('users', 'visible')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.users.visible.value }">▼</span>
                <span class="collapse-title">Éléments visibles ({{ visibleUsers.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.users.visible.value">
                <div 
                  v-for="user in visibleUsers" 
                  :key="user._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('users', user._id) }"
                  @click.stop
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('users', user._id)"
                        @change="toggleSelection('users', user._id)"
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="user.isVisible"
                        @change="markDirty('users', user)"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="user.displayName"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Email</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="user.email || 'N/A'"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage personnalisé</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="user.customDisplayName"
                        @input="markDirty('users', user)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Éléments non visibles -->
            <div v-if="hiddenUsers.length > 0" class="collapse-section">
              <div class="collapse-header" @click.self="toggleCollapse('users', 'hidden')">
                <span class="collapse-icon" :class="{ 'collapsed': !collapseStates.users.hidden.value }">▼</span>
                <span class="collapse-title">Éléments non visibles ({{ hiddenUsers.length }})</span>
              </div>
              <div class="collapse-content" v-show="collapseStates.users.hidden.value">
                <div 
                  v-for="user in hiddenUsers" 
                  :key="user._id"
                  class="data-item"
                  :class="{ 'selected': isSelected('users', user._id) }"
                >
                  <div class="data-item-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :checked="isSelected('users', user._id)"
                        @change="toggleSelection('users', user._id)"
                        class="selection-checkbox"
                      />
                      <span>Sélectionner</span>
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="user.isVisible"
                        @change="markDirty('users', user)"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div class="data-item-content">
                    <div class="data-item-field">
                      <label>Nom original</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="user.displayName"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Email</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        :value="user.email || 'N/A'"
                        disabled
                        @click.stop
                      />
                    </div>
                    <div class="data-item-field">
                      <label>Nom d'affichage personnalisé</label>
                      <input 
                        type="text" 
                        class="form-input" 
                        v-model="user.customDisplayName"
                        @input="markDirty('users', user)"
                        @mousedown.stop
                        placeholder="Nom personnalisé (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de renommage en masse -->
    <div v-if="showBulkRename" class="bulk-rename-modal-overlay" @click.self="showBulkRename = false">
      <div class="bulk-rename-modal">
        <div class="modal-header">
          <h3>Renommer les éléments sélectionnés</h3>
          <button class="close-btn" @click="showBulkRename = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nouveau nom d'affichage</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="bulkRenameValue"
              placeholder="Entrez le nouveau nom..."
              @keyup.enter="applyBulkRename"
            />
            <p class="form-help">Ce nom sera appliqué à tous les éléments sélectionnés</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showBulkRename = false">Annuler</button>
          <button class="btn btn-primary" @click="applyBulkRename">Appliquer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../api/client.js';
import { smartSearch } from '../services/semanticSearch.js';
import { useNotifications } from '../stores/notifications.js';

const props = defineProps({
  sourceId: {
    type: String,
    required: true
  },
  sourceName: {
    type: String,
    required: true
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const tabs = [
  { id: 'projects', label: 'Projets' },
  { id: 'pipelines', label: 'Pipelines' },
  { id: 'repositories', label: 'Repositories' },
  { id: 'users', label: 'Utilisateurs' }
];

const activeTab = ref('projects');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const { notify, addTask, removeTask } = useNotifications();

const projects = ref([]);
const pipelines = ref([]);
const repositories = ref([]);
const users = ref([]);

const searchProjects = ref('');
const searchPipelines = ref('');
const searchRepositories = ref('');
const searchUsers = ref('');

const excludeProjects = ref(false);
const excludePipelines = ref(false);
const excludeRepositories = ref(false);
const excludeUsers = ref(false);

const filterProjectPipeline = ref('');
const filterProjectRepository = ref('');

const dirtyItems = {
  projects: new Set(),
  pipelines: new Set(),
  repositories: new Set(),
  users: new Set()
};

// Gestion de la sélection multiple (utiliser des refs pour la réactivité Vue)
const selectedItems = {
  projects: ref(new Set()),
  pipelines: ref(new Set()),
  repositories: ref(new Set()),
  users: ref(new Set())
};

// Modal de renommage en masse
const showBulkRename = ref(false);
const bulkRenameType = ref('');
const bulkRenameValue = ref('');

// Fonctions de sélection
const isSelected = (type, itemId) => {
  return selectedItems[type].value.has(itemId);
};

const toggleSelection = (type, itemId) => {
  const set = selectedItems[type].value;
  if (set.has(itemId)) {
    set.delete(itemId);
  } else {
    set.add(itemId);
  }
  // Forcer la réactivité en créant un nouveau Set
  selectedItems[type].value = new Set(set);
};

const toggleSelectAll = (type) => {
  const items = getFilteredItems(type);
  const allSelected = isAllSelected(type);
  const newSet = new Set();
  
  if (!allSelected) {
    // Sélectionner tout
    items.forEach(item => {
      newSet.add(item._id);
    });
  }
  // Sinon, newSet reste vide (désélectionner tout)
  
  // Mettre à jour avec un nouveau Set pour déclencher la réactivité
  selectedItems[type].value = newSet;
};

const clearSelection = (type) => {
  selectedItems[type].value = new Set();
};

const isAllSelected = (type) => {
  const items = getFilteredItems(type);
  if (items.length === 0) return false;
  return items.every(item => selectedItems[type].value.has(item._id));
};

const isIndeterminate = (type) => {
  const items = getFilteredItems(type);
  if (items.length === 0) return false;
  const selectedCount = items.filter(item => selectedItems[type].value.has(item._id)).length;
  return selectedCount > 0 && selectedCount < items.length;
};

const getFilteredItems = (type) => {
  switch(type) {
    case 'projects': return filteredProjects.value;
    case 'pipelines': return filteredPipelines.value;
    case 'repositories': return filteredRepositories.value;
    case 'users': return filteredUsers.value;
    default: return [];
  }
};

// Actions groupées
const bulkSetVisible = (type, visible) => {
  const items = getFilteredItems(type);
  const selected = items.filter(item => selectedItems[type].value.has(item._id));
  
  selected.forEach(item => {
    item.isVisible = visible;
    markDirty(type, item);
  });
  
  clearSelection(type);
};

const showBulkRenameModal = (type) => {
  bulkRenameType.value = type;
  bulkRenameValue.value = '';
  showBulkRename.value = true;
};

const applyBulkRename = () => {
  if (!bulkRenameValue.value.trim()) {
    notify.warning('Nom requis', 'Veuillez entrer un nom');
    return;
  }
  
  const type = bulkRenameType.value;
  const items = getFilteredItems(type);
  const selected = items.filter(item => selectedItems[type].value.has(item._id));
  
  selected.forEach(item => {
    if (type === 'users') {
      item.customDisplayName = bulkRenameValue.value.trim();
    } else {
      item.displayName = bulkRenameValue.value.trim();
    }
    markDirty(type, item);
  });
  
  showBulkRename.value = false;
  bulkRenameValue.value = '';
  clearSelection(type);
};

const bulkSave = async (type) => {
  const items = getFilteredItems(type);
  const selected = items.filter(item => selectedItems[type].value.has(item._id));
  
  if (selected.length === 0) {
    notify.warning('Aucun élément', 'Veuillez sélectionner au moins un élément');
    return;
  }
  
  saving.value = true;
  error.value = '';
  
  try {
    const itemsToUpdate = selected.map(item => ({
      _id: item._id,
      displayName: type === 'users' ? item.customDisplayName : item.displayName,
      isVisible: item.isVisible
    }));
    
    // Mettre à jour en batch
    for (const update of itemsToUpdate) {
      await api.put(`/admin/data-sources/${props.sourceId}/azure-devops/${type}/${update._id}`, {
        displayName: update.displayName,
        isVisible: update.isVisible
      });
    }
    
    // Nettoyer les dirty items pour les éléments sauvegardés
    selected.forEach(item => {
      dirtyItems[type].delete(item._id);
    });
    
    clearSelection(type);
    notify.success('Mise à jour réussie', `${itemsToUpdate.length} élément(s) mis à jour avec succès`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la sauvegarde';
    notify.error('Erreur', error.value);
  } finally {
    saving.value = false;
  }
};

// Résultats de recherche sémantique
const semanticProjectsResults = ref([]);
const semanticPipelinesResults = ref([]);
const semanticRepositoriesResults = ref([]);
const semanticUsersResults = ref([]);

const isSearchingProjects = ref(false);
const isSearchingPipelines = ref(false);
const isSearchingRepositories = ref(false);
const isSearchingUsers = ref(false);

// Fonction pour effectuer la recherche sémantique
const performSemanticSearch = async (query, items, fields, resultRef, loadingRef, exclude = false) => {
  if (!query || query.trim().length === 0) {
    resultRef.value = items;
    return;
  }

  loadingRef.value = true;
  try {
    const results = await smartSearch(query, items, {
      fields,
      threshold: 0.25,
    });
    
    // Si mode exclusion, inverser les résultats
    if (exclude) {
      const resultIds = new Set(results.map(r => r._id || r.id));
      resultRef.value = items.filter(item => !resultIds.has(item._id || item.id));
    } else {
      resultRef.value = results;
    }
  } catch (error) {
    console.error('Erreur recherche sémantique:', error);
    // Fallback sur recherche textuelle
    const search = query.toLowerCase();
    const matchingItems = items.filter(item =>
      fields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(search);
      })
    );
    
    // Si mode exclusion, inverser les résultats
    if (exclude) {
      const matchingIds = new Set(matchingItems.map(r => r._id || r.id));
      resultRef.value = items.filter(item => !matchingIds.has(item._id || item.id));
    } else {
      resultRef.value = matchingItems;
    }
  } finally {
    loadingRef.value = false;
  }
};

// Watchers pour déclencher la recherche sémantique avec debounce
let searchDebounceTimer = null;
const debounceSearch = (query, items, fields, resultRef, loadingRef, exclude = false) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    performSemanticSearch(query, items, fields, resultRef, loadingRef, exclude);
  }, 300);
};

watch([searchProjects, projects, excludeProjects], ([query, items, exclude]) => {
  debounceSearch(query, items, ['name', 'displayName', 'description'], semanticProjectsResults, isSearchingProjects, exclude);
}, { immediate: true });

watch([searchPipelines, pipelines, filterProjectPipeline, excludePipelines], ([query, items, projectFilter, exclude]) => {
  let filtered = items;
  if (projectFilter) {
    filtered = filtered.filter(p => p.projectId === projectFilter);
  }
  debounceSearch(query, filtered, ['name', 'displayName', 'projectName'], semanticPipelinesResults, isSearchingPipelines, exclude);
}, { immediate: true });

watch([searchRepositories, repositories, filterProjectRepository, excludeRepositories], ([query, items, projectFilter, exclude]) => {
  let filtered = items;
  if (projectFilter) {
    filtered = filtered.filter(r => r.projectId === projectFilter);
  }
  debounceSearch(query, filtered, ['name', 'displayName', 'projectName'], semanticRepositoriesResults, isSearchingRepositories, exclude);
}, { immediate: true });

watch([searchUsers, users, excludeUsers], ([query, items, exclude]) => {
  debounceSearch(query, items, ['displayName', 'email', 'customDisplayName'], semanticUsersResults, isSearchingUsers, exclude);
}, { immediate: true });

// Computed properties avec fallback
const filteredProjects = computed(() => {
  if (!searchProjects.value) return projects.value;
  return semanticProjectsResults.value.length > 0 
    ? semanticProjectsResults.value 
    : projects.value;
});

const filteredPipelines = computed(() => {
  let filtered = pipelines.value;
  if (filterProjectPipeline.value) {
    filtered = filtered.filter(p => p.projectId === filterProjectPipeline.value);
  }
  if (!searchPipelines.value) return filtered;
  return semanticPipelinesResults.value.length > 0 
    ? semanticPipelinesResults.value 
    : filtered;
});

const filteredRepositories = computed(() => {
  let filtered = repositories.value;
  if (filterProjectRepository.value) {
    filtered = filtered.filter(r => r.projectId === filterProjectRepository.value);
  }
  if (!searchRepositories.value) return filtered;
  return semanticRepositoriesResults.value.length > 0 
    ? semanticRepositoriesResults.value 
    : filtered;
});

const filteredUsers = computed(() => {
  if (!searchUsers.value) return users.value;
  return semanticUsersResults.value.length > 0 
    ? semanticUsersResults.value 
    : users.value;
});

// États des collapses pour chaque type
const collapseStates = {
  projects: { visible: ref(true), hidden: ref(true) },
  pipelines: { visible: ref(true), hidden: ref(true) },
  repositories: { visible: ref(true), hidden: ref(true) },
  users: { visible: ref(true), hidden: ref(true) }
};

// Fonctions helper pour toggle les collapses
const toggleCollapse = (type, section) => {
  collapseStates[type][section].value = !collapseStates[type][section].value;
};

// Computed properties pour séparer visibles et non visibles
const visibleProjects = computed(() => {
  return filteredProjects.value.filter(p => p.isVisible);
});

const hiddenProjects = computed(() => {
  return filteredProjects.value.filter(p => !p.isVisible);
});

const visiblePipelines = computed(() => {
  return filteredPipelines.value.filter(p => p.isVisible);
});

const hiddenPipelines = computed(() => {
  return filteredPipelines.value.filter(p => !p.isVisible);
});

const visibleRepositories = computed(() => {
  return filteredRepositories.value.filter(r => r.isVisible);
});

const hiddenRepositories = computed(() => {
  return filteredRepositories.value.filter(r => !r.isVisible);
});

const visibleUsers = computed(() => {
  return filteredUsers.value.filter(u => u.isVisible);
});

const hiddenUsers = computed(() => {
  return filteredUsers.value.filter(u => !u.isVisible);
});

const getTabCount = (tabId) => {
  switch(tabId) {
    case 'projects': return projects.value.length;
    case 'pipelines': return pipelines.value.length;
    case 'repositories': return repositories.value.length;
    case 'users': return users.value.length;
    default: return 0;
  }
};

const markDirty = (type, item) => {
  dirtyItems[type].add(item._id);
};

const loadProjects = async () => {
  try {
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/projects`);
    projects.value = response.data.map(p => ({
      ...p,
      displayName: p.displayName || p.name
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des projets';
  }
};

const loadPipelines = async () => {
  try {
    const params = filterProjectPipeline.value ? { projectId: filterProjectPipeline.value } : {};
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/pipelines`, { params });
    pipelines.value = response.data.map(p => ({
      ...p,
      displayName: p.displayName || p.name
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des pipelines';
  }
};

const loadRepositories = async () => {
  try {
    const params = filterProjectRepository.value ? { projectId: filterProjectRepository.value } : {};
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/repositories`, { params });
    repositories.value = response.data.map(r => ({
      ...r,
      displayName: r.displayName || r.name
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des repositories';
  }
};

const loadUsers = async () => {
  try {
    const response = await api.get(`/admin/data-sources/${props.sourceId}/azure-devops/users`);
    users.value = response.data.map(u => ({
      ...u,
      customDisplayName: u.customDisplayName || u.displayName
    }));
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des utilisateurs';
  }
};

const saveAll = async (type) => {
  saving.value = true;
  error.value = '';
  
  try {
    const itemsToUpdate = [];
    const dirtySet = dirtyItems[type];
    
    let items;
    switch(type) {
      case 'projects': items = projects.value; break;
      case 'pipelines': items = pipelines.value; break;
      case 'repositories': items = repositories.value; break;
      case 'users': items = users.value; break;
    }
    
    for (const itemId of dirtySet) {
      const item = items.find(i => i._id === itemId);
      if (item) {
        itemsToUpdate.push({
          _id: item._id,
          displayName: type === 'users' ? item.customDisplayName : item.displayName,
          isVisible: item.isVisible
        });
      }
    }
    
    if (itemsToUpdate.length === 0) {
      saving.value = false;
      return;
    }
    
    // TODO: Créer une route pour mettre à jour en batch
    // Pour l'instant, on met à jour un par un
    for (const update of itemsToUpdate) {
      await api.put(`/admin/data-sources/${props.sourceId}/azure-devops/${type}/${update._id}`, {
        displayName: update.displayName,
        isVisible: update.isVisible
      });
    }
    
    dirtyItems[type].clear();
    notify.success('Mise à jour réussie', `${itemsToUpdate.length} élément(s) mis à jour avec succès`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la sauvegarde';
    notify.error('Erreur', error.value);
  } finally {
    saving.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    await Promise.all([
      loadProjects(),
      loadPipelines(),
      loadRepositories(),
      loadUsers()
    ]);
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement des données';
  } finally {
    loading.value = false;
  }
};

// Réinitialiser la sélection lors du changement d'onglet
watch(activeTab, () => {
  clearSelection('projects');
  clearSelection('pipelines');
  clearSelection('repositories');
  clearSelection('users');
});

onMounted(() => {
  if (props.sourceId) {
    loadData();
  } else {
    error.value = 'Source de données non définie';
  }
});

// Recharger les données si sourceId change
watch(() => props.sourceId, (newSourceId) => {
  if (newSourceId) {
    loadData();
  }
});
</script>

<style scoped>
.azure-devops-data-modal {
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  position: relative;
  z-index: 3001;
}

.azure-devops-data-modal.fullscreen {
  max-width: 100%;
  width: 100%;
  max-height: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  width: 32px;
  height: 32px;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
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

.modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.fullscreen .modal-content {
  height: 100%;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid var(--border-color);
  overflow-x: auto;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: var(--background);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.tab-count {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.8;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  min-height: 0;
  position: relative;
  z-index: 1;
  margin-top: 0;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.search-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-loading {
  position: absolute;
  right: 4rem;
  font-size: 1rem;
  animation: pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

.exclude-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.exclude-checkbox:hover {
  background: var(--background);
  color: var(--text-primary);
}

.exclude-checkbox input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.data-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-item {
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  background: var(--background);
}

.data-item-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.data-item-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  /* S'assurer que le contenu peut recevoir les événements */
  position: relative;
  z-index: 1;
}

.data-item-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  z-index: 2;
}

.data-item-field input {
  position: relative;
  z-index: 3;
}

/* S'assurer que tous les inputs sont interactifs */
.form-input {
  cursor: text;
}

input[type="checkbox"] {
  cursor: pointer;
}

input:disabled {
  cursor: not-allowed;
}

.data-item-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.loading, .error-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message {
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--danger-color);
}

/* Actions groupées */
.bulk-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}

.bulk-actions-info {
  font-weight: 600;
}

.bulk-actions-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bulk-actions-buttons .btn {
  background: white;
  color: var(--primary-color);
  border: none;
}

.bulk-actions-buttons .btn:hover {
  background: rgba(255, 255, 255, 0.9);
}

.bulk-actions-buttons .btn-ghost {
  background: transparent;
  color: white;
  border: 1px solid white;
}

.bulk-actions-buttons .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Sélection */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.select-all-checkbox:hover {
  color: var(--text-primary);
}

.selection-checkbox {
  margin-right: 0.5rem;
}

.data-item.selected {
  border-color: var(--primary-color);
  background: rgba(0, 123, 255, 0.05);
}

.data-item-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

/* Modal de renommage en masse */
.bulk-rename-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  backdrop-filter: blur(4px);
}

.bulk-rename-modal {
  background: var(--surface);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
}

.bulk-rename-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.bulk-rename-modal .modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.bulk-rename-modal .modal-body {
  padding: 1.5rem;
}

.bulk-rename-modal .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bulk-rename-modal .form-group label {
  font-weight: 600;
  color: var(--text-primary);
}

.bulk-rename-modal .form-help {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.bulk-rename-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid var(--border-color);
}

/* Sections collapse */
.collapse-section {
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.collapse-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--background);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-light);
  /* Pas de position relative pour éviter les problèmes de stacking context */
}

.collapse-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.collapse-icon,
.collapse-title {
  pointer-events: none;
}

.collapse-icon {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: var(--text-secondary);
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.collapse-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.collapse-content {
  padding: 0.5rem;
  background: var(--surface);
}

.collapse-content .data-item {
  margin-bottom: 0.5rem;
}

.collapse-content .data-item:last-child {
  margin-bottom: 0;
}

.collapse-content input[type="text"],
.collapse-content input[type="email"],
.collapse-content textarea {
  cursor: text;
}

.collapse-content input[type="checkbox"],
.collapse-content label {
  cursor: pointer;
}
</style>
