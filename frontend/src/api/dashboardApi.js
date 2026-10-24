import client from './client';

export const dashboardApi = {
  getMetrics: async () => {
    const res = await client.get('/dashboard');
    return res.data.data;
  }
};
