import { AxiosError } from 'axios';

import { useCallback } from 'react';
import { useToast } from './use-toast';
import { ErrorResponse } from '@/app/types';

export const useAxiosErrorHandler = () => {
  const { toast } = useToast();

  return useCallback((err: unknown, fallbackMessage = 'An unexpected error occurred') => {
    let message = fallbackMessage;

    if (err && typeof err === 'object' && 'isAxiosError' in err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message;
      }
    }

    console.error('Axios error:', err);

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  }, [toast]);
};
