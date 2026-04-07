import api from "./axios";
import type { AtivoResponse } from "@/types";

export const scannerApi = {
  listar: async (): Promise<AtivoResponse[]> => {
    const response = await api.get<AtivoResponse[]>("/scanner");
    return response.data;
  },
};
