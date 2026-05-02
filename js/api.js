/**
 * api.js
 * Mock service layer for the Meeting Leech Detector
 * Defaults to returning static JSON data but built with Fetch
 * to easily swap to a real backend.
 */

const API_BASE_URL = 'http://localhost:3000/api'; // Update when real backend is ready
const USE_MOCK_DATA = false; // Toggle this when backend is ready

const mockData = {
    employeeEngagement: [
        { id: 1, name: 'Alice Smith', role: 'Developer', score: 92, status: 'engaging' },
        { id: 2, name: 'Bob Jones', role: 'Designer', score: 45, status: 'leeching' },
        { id: 3, name: 'Charlie Brown', role: 'Product', score: 78, status: 'neutral' },
        { id: 4, name: 'Diana Prince', role: 'Marketing', score: 30, status: 'leeching' }
    ],
    alerts: [
        { id: 1, name: 'Bob Jones', reason: 'Window out of focus for 15 mins', time: '10 mins ago' },
        { id: 2, name: 'Diana Prince', reason: 'No speaking or chat activity', time: '25 mins ago' }
    ],
    analytics: {
        windowFocus: [65, 25, 10], // focused, blurred, background
        chatActivity: [12, 19, 3, 5, 2, 3], // messages per 10 mins
        speakingTime: [0, 5, 10, 15, 20, 25, 30], // mock labels
        speakingData: [10, 25, 40, 20, 60, 50, 80] // mock data
    },
    employeeStats: {
        score: 45,
        focus: 30,
        chat: 60,
        speaking: 20,
        meetingStatus: 'In Progress: Weekly Sync'
    }
};

const api = {
    async get(endpoint) {
        if (USE_MOCK_DATA) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Route mock requests
                    if (endpoint.includes('engagement')) resolve(mockData.employeeEngagement);
                    if (endpoint.includes('alerts')) resolve(mockData.alerts);
                    if (endpoint.includes('analytics')) resolve(mockData.analytics);
                    if (endpoint.includes('employee-stats')) resolve(mockData.employeeStats);
                    resolve({});
                }, 500); // simulate network delay
            });
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    async delete(endpoint) {
        if (USE_MOCK_DATA) return Promise.resolve({});
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Network response was not ok');
            return true;
        } catch (error) {
            console.error('API Delete Error:', error);
            throw error;
        }
    },
    async post(endpoint) {
        if (USE_MOCK_DATA) return Promise.resolve({});
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST' });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Post Error:', error);
            throw error;
        }
    }
};

window.api = api;
