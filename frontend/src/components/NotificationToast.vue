<template>
  <div class="notifications-container">
    <!-- Bouton de notification (toujours visible) -->
    <button 
      v-if="hasNotifications || hasTasks"
      class="notification-toggle-btn"
      @click="togglePanel"
      :title="isOpen ? 'Fermer les notifications' : 'Ouvrir les notifications'"
    >
      <span class="notification-icon-btn">🔔</span>
      <span v-if="totalCount > 0" class="badge-count">{{ totalCount > 99 ? '99+' : totalCount }}</span>
    </button>

    <!-- Panneau collapsible -->
    <transition name="panel">
      <div v-if="isOpen && (hasNotifications || hasTasks)" class="notifications-panel">
        <!-- Tâches en cours -->
        <div v-if="tasks.length > 0" class="tasks-panel">
          <div class="tasks-header">
            <h4>📋 Tâches en cours</h4>
            <button class="close-btn-sm" @click="clearTasks" title="Fermer toutes les tâches">
              ×
            </button>
          </div>
          <div class="tasks-list">
            <div v-for="task in tasks" :key="task.id" class="task-item">
              <div class="task-content">
                <div class="task-label">{{ task.label }}</div>
                <div v-if="task.progress !== null && task.progress !== undefined" class="task-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${Math.min(100, Math.max(0, task.progress))}%` }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ Math.round(task.progress) }}%</span>
                </div>
                <div v-else class="task-spinner">
                  <div class="spinner"></div>
                </div>
              </div>
              <button 
                v-if="task.cancellable" 
                class="task-cancel-btn"
                @click="cancelTask(task.id)"
                title="Annuler"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <transition-group name="notification" tag="div" class="notifications-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="['notification', `notification-${notification.type}`]"
          >
            <div class="notification-icon">
              <span v-if="notification.type === 'success'">✅</span>
              <span v-else-if="notification.type === 'error'">❌</span>
              <span v-else-if="notification.type === 'warning'">⚠️</span>
              <span v-else>ℹ️</span>
            </div>
            <div class="notification-content">
              <div v-if="notification.title" class="notification-title">
                {{ notification.title }}
              </div>
              <div v-if="notification.message" class="notification-message">
                {{ notification.message }}
              </div>
              <div v-if="notification.actions && notification.actions.length > 0" class="notification-actions">
                <button
                  v-for="action in notification.actions"
                  :key="action.label"
                  :class="['btn', 'btn-sm', action.primary ? 'btn-primary' : 'btn-secondary']"
                  @click="action.action"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
            <button
              class="notification-close"
              @click="removeNotification(notification.id)"
              title="Fermer"
            >
              ×
            </button>
          </div>
        </transition-group>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useNotifications } from '../stores/notifications.js';

const { notifications, tasks, removeNotification, clearTasks, removeTask } = useNotifications();

const isOpen = ref(false);

const hasNotifications = computed(() => notifications.value.length > 0);
const hasTasks = computed(() => tasks.value.length > 0);
const totalCount = computed(() => notifications.value.length + tasks.value.length);

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

// Auto-ouvrir quand une nouvelle notification arrive
watch(notifications, (newNotifications) => {
  if (newNotifications.length > 0 && !isOpen.value) {
    // Ouvrir automatiquement si c'est une notification importante (error, warning avec actions)
    const importantNotification = newNotifications.find(n => 
      n.type === 'error' || 
      (n.type === 'warning' && n.actions && n.actions.length > 0)
    );
    if (importantNotification) {
      isOpen.value = true;
    }
  }
}, { deep: true });

// Auto-ouvrir quand une nouvelle tâche arrive
watch(tasks, (newTasks) => {
  if (newTasks.length > 0 && !isOpen.value) {
    isOpen.value = true;
  }
}, { deep: true });

const cancelTask = (taskId) => {
  // Émettre un événement pour annuler la tâche si nécessaire
  removeTask(taskId);
};
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  pointer-events: none;
}

.notification-toggle-btn {
  background: var(--surface);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  pointer-events: all;
  position: relative;
}

.notification-toggle-btn:hover {
  background: var(--surface-hover);
  transform: scale(1.05);
  box-shadow: var(--shadow-xl);
}

.notification-icon-btn {
  font-size: 1.5rem;
  line-height: 1;
}

.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--danger-color);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 2px solid var(--surface);
}

.notifications-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  width: 100%;
  pointer-events: all;
  max-height: 80vh;
  overflow-y: auto;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.panel-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.tasks-panel {
  background: var(--surface);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 300px;
  overflow-y: auto;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid var(--border-color);
  background: var(--background);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.tasks-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn-sm {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn-sm:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--background);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--surface);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

.task-spinner {
  display: flex;
  align-items: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.task-cancel-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.25rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.task-cancel-btn:hover {
  background: var(--surface-hover);
  color: var(--danger-color);
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.notification-message {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  white-space: pre-line;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.notification-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.notification-success {
  border-left: 4px solid var(--success-color);
  background: linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.05) 100%);
}

.notification-error {
  border-left: 4px solid var(--danger-color);
  background: linear-gradient(135deg, var(--surface) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.notification-warning {
  border-left: 4px solid var(--warning-color);
  background: linear-gradient(135deg, var(--surface) 0%, rgba(245, 158, 11, 0.05) 100%);
}

.notification-info {
  border-left: 4px solid var(--primary-color);
  background: linear-gradient(135deg, var(--surface) 0%, rgba(96, 165, 250, 0.05) 100%);
}

@media (max-width: 768px) {
  .notifications-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
  
  .notification {
    min-width: auto;
  }
}
</style>

