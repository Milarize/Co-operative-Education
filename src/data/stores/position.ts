
import { ref } from "vue";
import { defineStore } from "pinia";
import auth from "../services/auth";
import router from "../../router";
import type { Position } from '../types/position.type';
import positionService from "../services/position";

export const usePositionStore = defineStore("position", () => {
  const positions = ref<Position[]>([]);
  const showAddDialog = ref(false);

  const getAllPositions = async () => {
    try {
      const response = await positionService.getAll();
      if (response.data) {
        positions.value = response.data;
        return response;
      }
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลตำแหน่งได้:", error);
      throw error;
    }
  };

  const getPositionById = async (id: string) => {
    const response = await positionService.getById(id);
    return response.data;
  };

  const createPosition = async (position: Position) => {
    const response = await positionService.create(position);
    return response.data;
  };

  const deletePosition = async (id: number) => {
    const response = await positionService.delete(id);
    
    return response.data;
  };



  return {
    positions,
    getAllPositions,
    getPositionById,
    showAddDialog,
    createPosition,
    deletePosition,
  };
});
