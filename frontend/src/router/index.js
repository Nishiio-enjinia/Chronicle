import { createRouter, createWebHistory } from 'vue-router';
import ChangelogsView from '../views/ChangelogsView.vue';
import EventsView from '../views/EventsView.vue';
import AdminView from '../views/AdminView.vue';
import PipelineLogsView from '../views/PipelineLogsView.vue';

const routes = [
  {
    path: '/',
    name: 'changelogs',
    component: ChangelogsView
  },
  {
    path: '/changelogs',
    redirect: '/'
  },
  {
    path: '/pipeline-logs',
    name: 'pipeline-logs',
    component: ChangelogsView
  },
  {
    path: '/events',
    name: 'events',
    component: EventsView
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;















