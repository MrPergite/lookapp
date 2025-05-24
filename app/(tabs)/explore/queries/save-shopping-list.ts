import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/client-api";

export const useSaveShoppingList = (onAuthRequired: () => void) => {
  const { isAuthenticated, callProtectedEndpoint } = useApi();

  const mutation = useMutation({
    mutationFn: async (product: any) => {
      if (!isAuthenticated) {
        onAuthRequired();
        return;
      }
      return await callProtectedEndpoint('saveShoppingItem', {
        method: 'POST',
        data: product
      });
    }
  });

  return {
    savedProducts: mutation.data,
    savingProducts: mutation.isPending,
    saveSuccess: mutation.isSuccess,
    saveError: mutation.error,
    saveShoppingItem: mutation.mutate,
    isPending: mutation.isPending
  };
}; 