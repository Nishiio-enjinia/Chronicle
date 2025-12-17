import { defineStore } from 'pinia';
import api from '../api/client.js';

export const useChangelogsStore = defineStore('changelogs', {
  state: () => ({
    changelogs: [],
    loading: false,
    error: null,
    filters: {
      site: '',
      application: '',
      startDate: '',
      endDate: '',
      source: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    },
    sites: [],
    applications: []
  }),

  actions: {
    async fetchChangelogs(params = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        const queryParams = {
          ...this.filters,
          ...params,
          page: this.pagination.page,
          limit: this.pagination.limit
        };
        
        // Nettoyer les paramètres vides
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === '' || queryParams[key] === null) {
            delete queryParams[key];
          }
        });
        
        const response = await api.get('/changelogs', { params: queryParams });
        this.changelogs = response.data.data;
        this.pagination = response.data.pagination;
      } catch (error) {
        this.error = error.response?.data?.error || error.message;
        console.error('Error fetching changelogs:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchSites() {
      try {
        const response = await api.get('/sites');
        this.sites = response.data;
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    },

    async fetchApplications() {
      try {
        const params = this.filters.site ? { site: this.filters.site } : {};
        const response = await api.get('/applications', { params });
        this.applications = response.data;
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    },

    setFilter(key, value) {
      this.filters[key] = value;
      this.pagination.page = 1; // Reset to first page
    },

    setPage(page) {
      this.pagination.page = page;
    },

    async createChangelog(changelogData) {
      try {
        const response = await api.post('/changelogs', changelogData);
        await this.fetchChangelogs();
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || error.message;
      }
    },

    async deleteChangelog(id) {
      try {
        await api.delete(`/changelogs/${id}`);
        await this.fetchChangelogs();
      } catch (error) {
        throw error.response?.data?.error || error.message;
      }
    }
  }
});















