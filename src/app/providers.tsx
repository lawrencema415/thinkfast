'use client';

import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/use-auth';
import { WebSocketProvider } from '@/lib/websocket';
import { GameProvider } from '@/hooks/use-game';

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<WebSocketProvider>
					<AuthProvider>
						<GameProvider>
							<div className='min-h-screen flex flex-col'>
								<Toaster />
								{children}
							</div>
						</GameProvider>
					</AuthProvider>
				</WebSocketProvider>
			</TooltipProvider>
		</QueryClientProvider>
	);
}