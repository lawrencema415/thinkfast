'use client';

import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { GameProvider } from '@/hooks/useGame';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

// Root providers component
export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<GameProvider>
					{children}
					<Toaster />
				</GameProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
