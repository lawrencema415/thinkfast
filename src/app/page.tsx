'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { NavigationBar } from '@/components/navigation-bar';
import { Footer } from '@/components/footer';
import { useGame } from '@/hooks/use-game';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from '@/components/ui/form';
import { MusicWave } from '@/components/ui/music-wave';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Users, Clock, Plus, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ReadyToPlayModal } from '@/components/ready-to-play-modal';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/Auth/AuthForm';
import { supabase } from '@/lib/supabase';

// Room creation form schema
const createRoomSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters'),
	songsPerPlayer: z.number().min(1).max(5),
	timePerSong: z.number().min(5).max(15),
});

// Join room form schema
const joinRoomSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters'),
	roomCode: z.string().min(4).max(10),
});

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
type JoinRoomFormValues = z.infer<typeof joinRoomSchema>;

// Move to constants file if needed in future
const DEFAULT_SONGS_PER_PLAYER = 3;
const DEFAULT_SECONDS_PER_SONG = 10;
const MIN_SECONDS_PER_SONG = 5;
const MAX_SECONDS_PER_SONG = 15;
const MIN_SONGS_PER_PLAYER = 1;
const MAX_SONGS_PER_PLAYER = 5;

export default function HomePage() {
	const { createRoomMutation, joinRoomMutation } = useGame();
	const [activeTab, setActiveTab] = useState<string>('create');
	const [showReadyToPlayModal, setShowReadyToPlayModal] = useState(false);
	const { user, loading } = useAuth();
	const router = useRouter();

	if (loading) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className='container mx-auto px-4'>
				<AuthForm />
			</div>
		);
	}

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
			router.push('/');
		} catch (error) {
			console.error('Error logging out:', error);
		}
	};

	return (
		<div className='flex flex-col min-h-screen bg-gray-900 text-white'>
			<div className='container mx-auto px-4 py-8'>
				<div className='flex justify-between items-center mb-8'>
					<h1 className='text-3xl font-bold'>Welcome, {user.email}</h1>
					<button
						onClick={handleLogout}
						className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
					>
						Logout
					</button>
				</div>
				<div>HELLO!</div>
			</div>
		</div>
	);
}

function Headphones(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns='http://www.w3.org/2000/svg'
			width='24'
			height='24'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3' />
		</svg>
	);
}
