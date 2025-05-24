import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/client-api";

export const useProdCardQueryMutation = (onSuccess?: (data: any, variables: any) => void) => {
  const { isAuthenticated, callProtectedEndpoint, callPublicEndpoint } = useApi();

  return useMutation({
    mutationFn: async ({ question, product }: { question: string; product: any }) => {
      if (isAuthenticated) {
        return await callProtectedEndpoint('prodCardQuery', {
          method: 'POST',
          data: { question, product }
        });
      } else {
        return await callPublicEndpoint('prodCardQueryPublic', {
          method: 'POST',
          data: { question, product }
        });
      }
    },
    onSuccess
  });
}; 