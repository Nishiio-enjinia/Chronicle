<template>
  <div class="type-selector">
    <div class="type-selector-header">
      <h3>Choisir un type de source</h3>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="type-options">
      <button 
        class="type-option azure-devops" 
        @click="$emit('select', 'azure-devops')"
      >
        <div class="type-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="4" fill="#0078D4"/>
            <path d="M24 12L12 18V30L24 36L36 30V18L24 12Z" fill="white"/>
            <path d="M24 16L16 20V28L24 32L32 28V20L24 16Z" fill="#0078D4"/>
          </svg>
        </div>
        <div class="type-info">
          <h4>Azure DevOps</h4>
          <p>Connectez-vous à Azure DevOps pour récupérer les pipelines et les tickets</p>
        </div>
      </button>

      <button 
        class="type-option custom" 
        @click="$emit('select', 'custom')"
      >
        <div class="type-icon">
          <span class="icon-text">⚙️</span>
        </div>
        <div class="type-info">
          <h4>Source personnalisée</h4>
          <p>Configurez une source de données personnalisée (n8n, API, webhook, etc.)</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['select', 'close']);
</script>

<style scoped>
.type-selector {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 0;
  max-width: 700px;
  width: 90%;
}

.type-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.type-selector-header h3 {
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

.type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--background);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.type-option:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.type-option.azure-devops:hover {
  border-color: #0078D4;
}

.type-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-icon .icon-text {
  font-size: 3rem;
  line-height: 1;
}

.type-info {
  flex: 1;
}

.type-info h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.type-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .type-options {
    grid-template-columns: 1fr;
  }
}
</style>
