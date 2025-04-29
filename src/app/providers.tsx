'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../shared/schema';
import { Toaster } from '@/components/ui/toaster';
import { GameProvider } from '@/hooks/use-game';
import { AuthProvider } from '@/hooks/use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a context for the user
interface UserContextType {
	user: User | null;
	isLoading: boolean;
	error: string | null;
	logout: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
	user: null,
	isLoading: true,
	error: null,
	logout: async () => {},
	refreshUser: async () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// User provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Function to fetch the current user
	const fetchUser = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch('/api/auth/user');

			if (!response.ok) {
				if (response.status === 401) {
					// Not authenticated, clear user
					setUser(null);
					return;
				}

				const data = await response.json();
				throw new Error(data.error || 'Failed to fetch user');
			}

			const userData = await response.json();
			setUser(userData);
		} catch (err) {
			console.error('Error fetching user:', err);
			setError(err instanceof Error ? err.message : 'An error occurred');
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	// Function to logout
	const logout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			setUser(null);
		} catch (err) {
			console.error('Error logging out:', err);
		}
	};

	// Fetch user on mount
	useEffect(() => {
		fetchUser();
	}, []);

	// Provide the user context
	return (
		<UserContext.Provider
			value={{
				user,
				isLoading,
				error,
				logout,
				refreshUser: fetchUser,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

// Create a client
const queryClient = new QueryClient();

// Root providers component
export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<UserProvider>
					<GameProvider>
						<div className='min-h-screen flex flex-col'>
							<Toaster />
							{children}
						</div>
					</GameProvider>
				</UserProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
