import http from "./axios";
import { Position } from "../types/position.type";

const positionService = {
  getAll: async () => {
    const response = await http.get("/position");
    return response;
  },
  getById: async (id: string) => {
    const response = await http.get(`/position/${id}`);
    return response;
  },


  create: async (position: Omit<Position, "id">) => {
    const response = await http.post("/position", position);
    return response;
  },

  update: async (id: number, position: Partial<Position>) => {
    const response = await http.put(`/position/${id}`, position);
    return response;
  },
  delete: async (id: number) => {
    const response = await http.delete(`/position/${id}`);
    return response;
  },

};

export default positionService;
