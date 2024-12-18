import { Organize } from "../types/organize.type";
import http from "./axios";

const userService = {
  getUser: async () => {
    console.log('กำลังดึงข้อมูลผู้ใช้ทั้งหมด');
    const token = localStorage.getItem('token');
    console.log('token', token);
    const response = await http.get('/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('ข้อมูลที่ได้รับ:', response.data);
    return response;
  },

  deleteUser: async (id: number) => {
    const token = localStorage.getItem('token');
    return await http.delete(`/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  updateUser: async (id: number, updateUserDto: any) => {
    const token = localStorage.getItem('token');
    return await http.patch(`/users/${id}`, updateUserDto, {
      headers: {
        Authorization: `Bearer ${token}` 
      }
    });
  },

  getSubordinates: async (id: number) => {
    const token = localStorage.getItem('token');
    return await http.get<Organize>(`/users/${id}/subordinates`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  assignSubordinate: async (leaderId: number, subordinateId: number) => {
    const token = localStorage.getItem('token');
    return await http.post(`/users/${leaderId}/subordinates/${subordinateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  structure: async () => {
    const token = localStorage.getItem('token');
    return await http.get('/users/organization/structure', { headers: { Authorization: `Bearer ${token}` } });
  },
  structureById: async (id: string) => {
    const token = localStorage.getItem('token');
    return await http.get(`/users/organization/structure/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  updateUserPosition: async (id: number, positionId: number) => {
    const token = localStorage.getItem('token');
    return await http.patch(`/users/${id}/position/${positionId}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  getUserPersonnel: async () => {
    const token = localStorage.getItem('token');
    return await http.get('/users/personnel', { headers: { Authorization: `Bearer ${token}` } });
  }
};

export default userService;