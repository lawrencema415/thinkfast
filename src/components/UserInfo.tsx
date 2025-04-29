'use client';

import { useUser } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserInfo() {
	const { user, isLoading, logout } = useUser();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.push('/login');
	};

	if (isLoading) {
		return <div className='text-sm text-gray-500'>Loading...</div>;
	}

	if (!user) {
		return (
			<div className='flex items-center space-x-2'>
				<Link
					href='/login'
					className='text-sm font-medium text-indigo-600 hover:text-indigo-500'
				>
					Sign in
				</Link>
			</div>
		);
	}

	return (
		<div className='flex items-center space-x-4'>
			<div className='flex items-center space-x-2'>
				<span className='text-sm font-medium text-gray-700'>
					{user.username}
				</span>
				{user.avatarUrl && (
					<img
						src={user.avatarUrl}
						alt={user.username}
						className='h-8 w-8 rounded-full'
					/>
				)}
			</div>
			<button
				onClick={handleLogout}
				className='text-sm font-medium text-gray-700 hover:text-gray-900'
			>
				Logout
			</button>
		</div>
	);
}
