import { ref, reactive } from 'vue';

const notifications = ref([]);
const tasks = ref([]);

let notificationIdCounter = 0;
let taskIdCounter = 0;

/**
 * Ajoute une notification
 * @param {Object} notification - { type: 'success'|'error'|'info'|'warning', title: string, message: string, duration?: number }
 */
export const addNotification = (notification) => {
  const id = ++notificationIdCounter;
  const notif = {
    id,
    type: notification.type || 'info',
    title: notification.title || '',
    message: notification.message || '',
    duration: notification.duration !== undefined ? notification.duration : 5000,
    timestamp: new Date(),
    ...notification
  };
  
  notifications.value.push(notif);
  
  // Auto-dismiss après la durée spécifiée
  if (notif.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, notif.duration);
  }
  
  return id;
};

/**
 * Supprime une notification
 */
export const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

/**
 * Supprime toutes les notifications
 */
export const clearNotifications = () => {
  notifications.value = [];
};

/**
 * Ajoute une tâche en cours
 * @param {Object} task - { id?: string, label: string, progress?: number }
 */
export const addTask = (task) => {
  const id = task.id || `task-${++taskIdCounter}`;
  const taskObj = {
    id,
    label: task.label || 'Tâche en cours...',
    progress: task.progress !== undefined ? task.progress : null,
    timestamp: new Date(),
    ...task
  };
  
  tasks.value.push(taskObj);
  return id;
};

/**
 * Met à jour une tâche
 */
export const updateTask = (id, updates) => {
  const task = tasks.value.find(t => t.id === id);
  if (task) {
    Object.assign(task, updates);
  }
};

/**
 * Supprime une tâche
 */
export const removeTask = (id) => {
  const index = tasks.value.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks.value.splice(index, 1);
  }
};

/**
 * Supprime toutes les tâches
 */
export const clearTasks = () => {
  tasks.value = [];
};

/**
 * Helpers pour les types de notifications
 */
export const notify = {
  success: (title, message, duration) => {
    return addNotification({ type: 'success', title, message, duration });
  },
  error: (title, message, duration) => {
    return addNotification({ type: 'error', title, message, duration: duration || 7000 });
  },
  info: (title, message, duration) => {
    return addNotification({ type: 'info', title, message, duration });
  },
  warning: (title, message, duration) => {
    return addNotification({ type: 'warning', title, message, duration });
  }
};

/**
 * Helper pour les confirmations (remplace confirm)
 */
export const confirmAction = (message, title = 'Confirmation') => {
  return new Promise((resolve) => {
    const id = addNotification({
      type: 'warning',
      title,
      message,
      duration: 0, // Ne pas auto-dismiss
      actions: [
        {
          label: 'Confirmer',
          action: () => {
            removeNotification(id);
            resolve(true);
          },
          primary: true
        },
        {
          label: 'Annuler',
          action: () => {
            removeNotification(id);
            resolve(false);
          }
        }
      ]
    });
  });
};

export const useNotifications = () => {
  return {
    notifications,
    tasks,
    addNotification,
    removeNotification,
    clearNotifications,
    addTask,
    updateTask,
    removeTask,
    clearTasks,
    notify,
    confirmAction
  };
};

