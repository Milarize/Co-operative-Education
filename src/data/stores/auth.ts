import { ref } from "vue";
import { defineStore } from "pinia";
import auth from "../services/auth";
import router from "../../router";
import type { User } from '../types/user.type';

export const useAuthStore = defineStore("auth", () => {
  const authName = ref({});
  const isLogin = ref(false);

  const login = async (email: string, password: string) => {
    try {
      const response = await auth.login(email, password);
      console.log('Login response', response);
      if (response.data) {
        authName.value = response.data;
        isLogin.value = true;
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.access_token);
        router.push("/home");
        return response;
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };
  const logout = async (email: string) => {
    console.log(email);
    await auth.logout(email);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    isLogin.value = false;
  }

  const getUserFromLocalStorage = () => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userObject: User = JSON.parse(userString);
        authName.value = userObject;
        isLogin.value = true;
      } catch (e) {
        console.error("ไม่สามารถแปลงข้อมูลผู้ใช้จาก localStorage ได้:", e);
        isLogin.value = false;
      }
    } else {
      console.log("ไม่พบข้อมูลผู้ใช้ใน localStorage");
      isLogin.value = false;
    }
  };
  const registerAdmin = async (formData: {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    idNumber: string
  }) => {
    try {
      const response = await auth.registerAdmin(formData);
      if (response.data) {
        router.push("/login");
        return response;
      }
    } catch (error) {
      console.error("การลงทะเบียนล้มเหลว:", error);
      throw error;
    }
  };
  const register = async (formData: {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    idNumber: string
  }) => {
    try {
      const response = await auth.authenticate(formData);
      if (response.data) {
        router.push("/login");
        return response;
      }
    } catch (error) {
      console.error("การลงทะเบียนล้มเหลว:", error);
      throw error;
    }
  };

  return {
    login,
    logout,
    getUserFromLocalStorage,
    registerAdmin,
    register
  };
});
