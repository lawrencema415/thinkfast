import { HeadphonesIcon } from 'lucide-react';
import { Link } from 'wouter';

export function Footer() {
	return (
		<footer className='bg-dark mt-auto py-4 border-t border-gray-800'>
			<div className='container mx-auto px-4'>
				<div className='flex flex-col md:flex-row justify-between items-center'>
					<div className='flex items-center space-x-1 mb-4 md:mb-0'>
						<HeadphonesIcon className='text-accent text-xl' />
						<Link href='/'>
							<p className='text-lg font-heading font-bold text-white cursor-pointer'>
								<span className='text-primary'>Think</span>
								<span className='text-secondary'>Fast</span>
							</p>
						</Link>
					</div>

					<div className='flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400'>
						<a href='#' className='hover:text-white transition-colors'>
							About
						</a>
						<a href='#' className='hover:text-white transition-colors'>
							Privacy Policy
						</a>
						<a href='#' className='hover:text-white transition-colors'>
							Terms of Service
						</a>
						<a href='#' className='hover:text-white transition-colors'>
							Contact
						</a>
					</div>

					<div className='mt-4 md:mt-0 flex space-x-4'>
						<a
							href='#'
							className='text-gray-400 hover:text-white transition-colors'
						>
							<SpotifyIcon className='h-5 w-5' />
						</a>
						<a
							href='#'
							className='text-gray-400 hover:text-white transition-colors'
						>
							<YoutubeIcon className='h-5 w-5' />
						</a>
						<a
							href='#'
							className='text-gray-400 hover:text-white transition-colors'
						>
							<TwitterIcon className='h-5 w-5' />
						</a>
						<a
							href='#'
							className='text-gray-400 hover:text-white transition-colors'
						>
							<InstagramIcon className='h-5 w-5' />
						</a>
					</div>
				</div>

				<div className='mt-4 text-center text-xs text-gray-500'>
					&copy; {new Date().getFullYear()} ThinkFast. All rights reserved.
				</div>
			</div>
		</footer>
	);
}

function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
			<path d='M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM16.5917 16.5917C16.2834 16.9 15.7917 16.9 15.4834 16.5917C14.15 15.4334 12.3834 14.95 10.3167 15.4334C9.85005 15.525 9.38338 15.2167 9.29171 14.75C9.20005 14.2834 9.50838 13.8167 9.97505 13.725C12.475 13.1417 14.6667 13.725 16.3167 15.15C16.625 15.4584 16.625 15.95 16.3167 16.2584L16.5917 16.5917ZM17.6667 13.5C17.2834 13.8834 16.6667 13.8834 16.2834 13.5C14.7084 12.1584 12.3834 11.55 10.0417 12.1584C9.55838 12.2917 9.05838 12.0334 8.92505 11.55C8.79171 11.0667 9.05005 10.5667 9.53338 10.4334C12.3834 9.70837 15.1334 10.4334 17.0834 12.0334C17.4667 12.3334 17.4667 12.95 17.0834 13.3334L17.6667 13.5ZM17.8334 10.6334C15.8834 9.08337 12.475 8.82503 9.88338 9.55837C9.30838 9.70837 8.70838 9.38337 8.55838 8.8917C8.40838 8.3167 8.73338 7.7167 9.22505 7.5667C12.2 6.73337 16.0667 7.0167 18.425 8.8917C18.8834 9.2167 18.9667 9.8917 18.6417 10.35C18.3167 10.7167 17.6417 10.8 17.1834 10.475L17.8334 10.6334Z' />
		</svg>
	);
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
			<path d='M21.543 6.498C22 8.28 22 12 22 12C22 12 22 15.72 21.543 17.502C21.289 18.487 20.546 19.262 19.605 19.524C17.896 20 12 20 12 20C12 20 6.107 20 4.395 19.524C3.45 19.258 2.708 18.484 2.457 17.502C2 15.72 2 12 2 12C2 12 2 8.28 2.457 6.498C2.711 5.513 3.454 4.738 4.395 4.476C6.107 4 12 4 12 4C12 4 17.896 4 19.605 4.476C20.55 4.742 21.292 5.516 21.543 6.498ZM10 15.5L16 12L10 8.5V15.5Z' />
		</svg>
	);
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
			<path d='M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z' />
		</svg>
	);
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
			<path d='M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z' />
		</svg>
	);
}
