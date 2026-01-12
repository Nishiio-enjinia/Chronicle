import { defineStore } from 'pinia';
import api from '../api/client.js';

export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [],
    loading: false,
    error: null,
    filters: {
      site: '',
      application: '',
      type: '',
      status: '',
      startDate: '',
      endDate: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }),

  actions: {
    async fetchEvents(params = {}) {
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
        
        const response = await api.get('/events', { params: queryParams });
        this.events = response.data.data;
        this.pagination = response.data.pagination;
      } catch (error) {
        this.error = error.response?.data?.error || error.message;
        console.error('Error fetching events:', error);
      } finally {
        this.loading = false;
      }
    },

    setFilter(key, value) {
      this.filters[key] = value;
      this.pagination.page = 1;
    },

    setPage(page) {
      this.pagination.page = page;
    },

    async createEvent(eventData) {
      try {
        const response = await api.post('/events', eventData);
        await this.fetchEvents();
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || error.message;
      }
    },

    async updateEvent(id, eventData) {
      try {
        const response = await api.put(`/events/${id}`, eventData);
        await this.fetchEvents();
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || error.message;
      }
    },

    async deleteEvent(id) {
      try {
        await api.delete(`/events/${id}`);
        await this.fetchEvents();
      } catch (error) {
        throw error.response?.data?.error || error.message;
      }
    }
  }
});

























