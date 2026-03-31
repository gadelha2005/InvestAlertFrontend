import { useCallback } from "react";

/**
 * Hook que envolve uma função assíncrona com um delay mínimo de 1 segundo
 * para melhorar a UX em operações CRUD rápidas
 */
export function useLoadingWithDelay() {
  return useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    const result = await asyncFn();
    const elapsedTime = Date.now() - startTime;

    // Se a requisição levou menos de 1 segundo, aguarda o restante
    if (elapsedTime < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsedTime));
    }

    return result;
  }, []);
}
