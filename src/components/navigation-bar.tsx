import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getInitials } from '@/lib/utils';
import {
	HeadphonesIcon,
	HelpCircleIcon,
	TrophyIcon,
	MenuIcon,
	UserIcon,
	LogOutIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NavigationBar() {
	const { user, logoutMutation } = useAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const router = useRouter();

	const handleLogout = () => {
		logoutMutation.mutate();
	};

	const isAuthenticated = !!user;
	// const isInGameRoom = location.startsWith('/room/');
	// TODO: FIX THIS
	const isInGameRoom = false;

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

				{isAuthenticated ? (
					<div className='flex items-center space-x-4'>
						{!isInGameRoom && (
							<div className='hidden md:flex items-center space-x-4'>
								<Button variant='ghost' className='rounded-full'>
									<HelpCircleIcon className='h-4 w-4 mr-1' /> How to Play
								</Button>
								<Button variant='ghost' className='rounded-full'>
									<TrophyIcon className='h-4 w-4 mr-1' /> Leaderboard
								</Button>
							</div>
						)}

						<div className='flex items-center space-x-2'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										className='flex items-center space-x-2 p-2 rounded-full hover:bg-surface transition-colors'
									>
										<Avatar className='h-8 w-8 border-2 border-accent'>
											<AvatarImage src={user.avatarUrl} />
											<AvatarFallback>
												{getInitials(user.username)}
											</AvatarFallback>
										</Avatar>
										<span className='hidden md:inline text-sm font-medium'>
											{user.username}
										</span>
										<ChevronDownIcon className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='end'
									className='bg-dark border-gray-700'
								>
									{/* <DropdownMenuItem className='cursor-pointer'>
										<UserIcon className='h-4 w-4 mr-2' /> Profile
									</DropdownMenuItem>
									<DropdownMenuSeparator className='bg-gray-700' /> */}
									<DropdownMenuItem
										className='cursor-pointer text-red-500 focus:text-red-500'
										onClick={handleLogout}
									>
										<LogOutIcon className='h-4 w-4 mr-2' /> Logout
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
								<SheetTrigger asChild>
									<Button variant='ghost' size='icon' className='md:hidden'>
										<MenuIcon className='h-6 w-6' />
									</Button>
								</SheetTrigger>
								<SheetContent className='bg-dark border-gray-700'>
									<div className='flex flex-col space-y-4 mt-8'>
										<Button variant='ghost' className='justify-start'>
											<HelpCircleIcon className='h-5 w-5 mr-2' /> How to Play
										</Button>
										<Button variant='ghost' className='justify-start'>
											<TrophyIcon className='h-5 w-5 mr-2' /> Leaderboard
										</Button>
										{/* <Button variant='ghost' className='justify-start'>
											<UserIcon className='h-5 w-5 mr-2' /> Profile
										</Button> */}
										<Button
											variant='ghost'
											className='justify-start text-red-500 hover:text-red-500'
											onClick={handleLogout}
										>
											<LogOutIcon className='h-5 w-5 mr-2' /> Logout
										</Button>
									</div>
								</SheetContent>
							</Sheet>
						</div>
					</div>
				) : (
					<div>
						<Button asChild>
							<Link href='/auth'>Login</Link>
						</Button>
					</div>
				)}
			</nav>
		</header>
	);
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
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
			<path d='m6 9 6 6 6-6' />
		</svg>
	);
}
