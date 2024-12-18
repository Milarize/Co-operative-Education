import http from "./axios";

const reportService = {
  getUserReport: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await http.get(`/userlogs/report?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },
  getTodayReport: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await http.get(`/userlogs/today?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}` 
      }
    });
    return response;
  }
};



export default reportService;