<template>
  <div class="custom-data-source-form">
    <div class="form-header">
      <div class="form-header-content">
        <div class="form-icon">⚙️</div>
        <h3>{{ editing ? 'Modifier' : 'Ajouter' }} une source personnalisée</h3>
      </div>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-group">
        <label class="form-label">Nom *</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.name" 
          required 
        />
      </div>

      <div class="form-group">
        <label class="form-label">Type *</label>
        <select class="form-select" v-model="form.type" required>
          <option value="n8n">n8n</option>
          <option value="api">API</option>
          <option value="manual">Manuel</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea 
          class="form-textarea" 
          v-model="form.description"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">URL</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.config.url" 
        />
      </div>

      <div class="form-group">
        <label class="form-label">Clé API</label>
        <input 
          type="password" 
          class="form-input" 
          v-model="form.config.apiKey" 
        />
      </div>

      <div class="form-group">
        <label class="form-label">URL Webhook</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.config.webhookUrl" 
        />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.isActive" />
          <span>Activer cette source</span>
        </label>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Enregistrement...' : (editing ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  source: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'close']);

const editing = ref(!!props.source);
const saving = ref(false);
const error = ref('');

const form = reactive({
  name: props.source?.name || '',
  type: props.source?.type || 'n8n',
  description: props.source?.description || '',
  config: {
    url: props.source?.config?.url || '',
    apiKey: props.source?.config?.apiKey || '',
    webhookUrl: props.source?.config?.webhookUrl || ''
  },
  isActive: props.source?.isActive ?? true
});

const handleSubmit = async () => {
  saving.value = true;
  error.value = '';

  try {
    await emit('submit', { ...form });
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'enregistrement';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.custom-data-source-form {
  background: var(--surface);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 10;
}

.form-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-icon {
  font-size: 2rem;
  line-height: 1;
}

.form-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
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

.form-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  padding: 1rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
  border-left: 4px solid var(--danger-color);
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}
</style>
