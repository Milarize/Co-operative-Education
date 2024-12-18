import { ref } from "vue";
import { defineStore } from "pinia";
import userService from "../services/user";
import type { User } from "../types/user.type";
import { OrganizeUser } from "../types/organize.type";
import { OrganizeAll } from "../types/organize.all.type";

export const useUserStore = defineStore("user", () => {
  const user = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const users = ref<User | null>(null)
  const subordinates = ref<OrganizeUser[]>([])
  const structure = ref<OrganizeAll | null>(null)
  const structureById = ref<OrganizeAll | null>(null)
  const personnel = ref<User[]>([])
  const initUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      users.value = JSON.parse(storedUser).user
    }
  }
  const getSubordinates = async (id: number) => {
    try {
      loading.value = true;
      const response = await userService.getSubordinates(id);
      subordinates.value = response.data.data;
      return response.data;
    } catch (err) {
      error.value = "ไม่สามารถดึงข้อมูลผู้ใต้บังคับบัญชาได้";
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใต้บังคับบัญชา:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (id: number, updateUserDto: any) => {
    console.log('ไอดีที่ได้รับ',id);
    try {
      loading.value = true;
      const response = await userService.updateUser(id, updateUserDto);
      if (response.status === 200) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.user = { ...userData.user, ...updateUserDto };
          localStorage.setItem('user', JSON.stringify(userData));
          users.value = userData.user
        }
      }
    } catch (err) {
      error.value = "ไม่สามารถอัพเดทข้อมูลผู้ใช้ได้";
      console.error("เกิดข้อผิดพลาดในการอัพเดทข้อมูลผู้ใช้:", err);
    } finally {
      loading.value = false;
    }
  };
  const fetchUser = async () => {
    try {
      loading.value = true;
      const response = await userService.getUser();
      user.value = response.data;
    } catch (err) {
      error.value = "ไม่สามารถดึงข้อมูลผู้ใช้ได้";
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", err);
    } finally {
      loading.value = false;
    }
  };
  const deleteUser = async (id: number) => {
    try {
      loading.value = true;
      console.log(id);
      await userService.deleteUser(id);
    } catch (err) {
      error.value = "ไม่สามารถลบข้อมูลผู้ใช้ได้";
      console.error("เกิดข้อผิดพลาดในการลบข้อมูลผู้ใช้:", err);
    } finally {
      loading.value = false;
    }
  };
  const getStructure = async () => {
    try {
      loading.value = true;
      const response = await userService.structure();
      structure.value = response.data;
    } catch (err) {
      error.value = "ไม่สามารถดึงข้อมูลสถานะองค์กรได้";
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะองค์กร:", err);
    } finally {
      loading.value = false;
    }
  }
  const getStructureById = async (id: string) => {
    try {
      loading.value = true;
      const response = await userService.structureById(id);
      structureById.value = response.data;
    } catch (err) {
      error.value = "ไม่สามารถดึงข้อมูลสถานะองค์กรได้";
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะองค์กร:", err);
    } finally {
      loading.value = false;
    }
  };
  const updateUserPosition = async (id: number, positionId: number) => {
    try {
      await userService.updateUserPosition(id, positionId);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการอัพเดทตำแหน่งผู้ใช้:", err);
    }
  };
  const getUserPersonnel = async () => {
    try {
      const response = await userService.getUserPersonnel();
      personnel.value = response.data;
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้บริการ:", err);
    }
  };
  const assignSubordinate = async (leaderId: number, subordinateId: number) => {
    await userService.assignSubordinate(leaderId, subordinateId);
  };
  return {
    user,
    loading,
    error,
    fetchUser,
    deleteUser,
    updateUser, 
    assignSubordinate,
    initUser,users,
    getSubordinates,
    subordinates,
    getStructure,
    structure,
    getStructureById,
    structureById,
    updateUserPosition,
    getUserPersonnel,
    personnel
  };
});
