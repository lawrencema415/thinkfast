// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import {
// 	DropdownMenu,
// 	DropdownMenuContent,
// 	DropdownMenuItem,
// 	DropdownMenuSeparator,
// 	DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { getInitials } from '@/lib/utils';
import {
	HeadphonesIcon,
	// 	HelpCircleIcon,
	// 	TrophyIcon,
	// 	MenuIcon,
	// 	UserIcon,
	// 	LogOutIcon,
} from 'lucide-react';
// import { useRouter } from 'next/navigation';

export function NavigationBar() {
	// const { user, logoutMutation } = useAuth();
	// const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	// const router = useRouter();

	// const handleLogout = () => {
	// 	logoutMutation.mutate();
	// };

	// const isAuthenticated = !!user;
	// const isInGameRoom = location.startsWith('/room/');
	// TODO: FIX THIS
	// const isInGameRoom = false;

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
			</nav>
		</header>
	);
}

// function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
// 	return (
// 		<svg
// 			{...props}
// 			xmlns='http://www.w3.org/2000/svg'
// 			width='24'
// 			height='24'
// 			viewBox='0 0 24 24'
// 			fill='none'
// 			stroke='currentColor'
// 			strokeWidth='2'
// 			strokeLinecap='round'
// 			strokeLinejoin='round'
// 		>
// 			<path d='m6 9 6 6 6-6' />
// 		</svg>
// 	);
// }
