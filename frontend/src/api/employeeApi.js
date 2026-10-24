import client from './client';

export const employeeApi = {
  getEmployees: async (params = {}) => {
    const res = await client.get('/employees', { params });
    return res.data;
  },

  getEmployeeById: async (id) => {
    const res = await client.get(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (data) => {
    const res = await client.post('/employees', data);
    return res.data;
  },

  updateEmployee: async (id, data) => {
    const res = await client.put(`/employees/${id}`, data);
    return res.data;
  },

  deleteEmployee: async (id) => {
    const res = await client.delete(`/employees/${id}`);
    return res.data;
  },

  getEmployeeOptions: async () => {
    const res = await client.get('/employees/options');
    return res.data.data;
  },

  downloadCsv: async (params = {}) => {
    const exportParams = { ...params };
    delete exportParams.page;
    delete exportParams.limit;

    const res = await client.get('/employees/export/csv', {
      params: exportParams,
      responseType: 'blob'
    });

    const filename = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 60000);
  }
};
