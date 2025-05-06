'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { HeadphonesIcon, UserCircle, LogOut } from 'lucide-react';

export function NavigationBar() {
	const { user, signOut } = useAuth();

	const handleLogout = async () => {
		await signOut();
	};

	return (
		<header className='bg-dark shadow-lg'>
			<nav className='container mx-auto px-4 py-3 flex items-center justify-between'>
				<div className='flex items-center space-x-1'>
					<HeadphonesIcon className='text-accent text-2xl' />
					<Link href='/'>
						<h1 className='text-xl md:text-2xl font-heading font-bold text-white cursor-pointer'>
							<span className='text-primary'>Think</span>
							<span className='text-secondary'>Fast</span>
						</h1>
					</Link>
				</div>

				{user ? (
					<div className='flex items-center space-x-3'>
						<span className='text-gray-300'>
							{user.user_metadata.display_name}
						</span>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant='ghost' className='h-10 w-10 rounded-full p-0'>
									<UserCircle className='h-6 w-6 text-gray-300' />
								</Button>
							</PopoverTrigger>
							<PopoverContent className='w-48' align='end'>
								<Button
									variant='ghost'
									className='w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10'
									onClick={handleLogout}
								>
									<LogOut className='mr-2 h-4 w-4' />
									Log out
								</Button>
							</PopoverContent>
						</Popover>
					</div>
				) : (
					<Link href='/login'>
						<Button
							variant='ghost'
							className='text-sm px-7 py-3 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300'
						>
							Log In
						</Button>
					</Link>
				)}
			</nav>
		</header>
	);
}
