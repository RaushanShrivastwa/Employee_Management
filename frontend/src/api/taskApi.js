import client from './client';

export const taskApi = {
  getTasks: async (params = {}) => {
    const res = await client.get('/tasks', { params });
    return res.data;
  },

  getTaskById: async (id) => {
    const res = await client.get(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (data) => {
    const res = await client.post('/tasks', data);
    return res.data;
  },

  updateTask: async (id, data) => {
    const res = await client.put(`/tasks/${id}`, data);
    return res.data;
  },

  updateTaskStatus: async (id, status) => {
    const res = await client.put(`/tasks/${id}/status`, { status });
    return res.data;
  },

  deleteTask: async (id) => {
    const res = await client.delete(`/tasks/${id}`);
    return res.data;
  },

  downloadCsv: async (params = {}) => {
    // Strip page and limit from export params so all matching records are exported
    const exportParams = { ...params };
    delete exportParams.page;
    delete exportParams.limit;

    const res = await client.get('/tasks/export/csv', {
      params: exportParams,
      responseType: 'blob'
    });

    const filename = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;

    // Ensure the blob is properly recognized as Excel-compatible CSV
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // CRITICAL: Do NOT revoke the object URL immediately!
    // Immediate revocation causes Chrome/Edge to lose the filename & extension
    // and save the file under the raw internal UUID blob GUID.
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 60000);
  }
};
