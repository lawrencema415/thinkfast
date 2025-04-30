'use client';

import { createContext, ReactNode, useContext } from 'react';
import {
	useQuery,
	useMutation,
	UseMutationResult,
} from '@tanstack/react-query';
import { User as SelectUser } from '@shared/schema';
import { getQueryFn, apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
	user: SelectUser | null;
	isLoading: boolean;
	error: Error | null;
	createGuestUserMutation: UseMutationResult<
		SelectUser,
		Error,
		{ username: string }
	>;
	logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { toast } = useToast();
	const {
		data: user,
		error,
		isLoading,
	} = useQuery<SelectUser | null, Error>({
		queryKey: ['/api/user'],
		queryFn: getQueryFn({ on401: 'returnNull' }),
	});

	const createGuestUserMutation = useMutation({
		mutationFn: async (data: { username: string }) => {
			const res = await apiRequest('POST', '/api/auth/guest', data);
			return await res.json();
		},
		onSuccess: (user: SelectUser) => {
			queryClient.setQueryData(['/api/user'], user);
			toast({
				title: 'Welcome!',
				description: `Hello, ${user.username}!`,
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Error',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	const logoutMutation = useMutation({
		mutationFn: async () => {
			await apiRequest('POST', '/api/logout');
		},
		onSuccess: () => {
			queryClient.setQueryData(['/api/user'], null);
			toast({
				title: 'Goodbye!',
				description: 'You have been logged out.',
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Logout failed',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	return (
		<AuthContext.Provider
			value={{
				user: user || null,
				isLoading,
				error,
				createGuestUserMutation,
				logoutMutation,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
