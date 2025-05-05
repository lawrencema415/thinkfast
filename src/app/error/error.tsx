'use client';

import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	// const router = useRouter();

	useEffect(() => {
		// Log the error to your error reporting service
		console.error(error);
	}, [error]);

	return (
		<div className='min-h-screen bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center p-4'>
			<div className='bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full shadow-2xl text-center'>
				<div className='mb-8'>
					<h1 className='text-6xl font-bold text-white mb-2'>🎵</h1>
					<h2 className='text-3xl font-bold text-white mb-4'>Oops!</h2>
					<p className='text-white/80 text-lg mb-6'>
						Looks like our music skipped a beat
					</p>
					<p className='text-white/60 text-sm mb-8'>
						{error.message || 'Something went wrong while loading the game'}
					</p>
				</div>

				<div className='space-y-4'>
					<button
						onClick={() => reset()}
						className='w-full px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-colors'
					>
						Try Again
					</button>

					<Link
						href='/'
						className='block w-full px-6 py-3 bg-purple-600/30 text-white rounded-lg font-semibold hover:bg-purple-600/40 transition-colors'
					>
						Back to Home
					</Link>
				</div>

				<p className='mt-8 text-white/40 text-sm'>Error ID: {error.digest}</p>
			</div>
		</div>
	);
}
