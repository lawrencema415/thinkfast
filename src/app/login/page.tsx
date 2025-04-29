'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Login failed');
			}

			// Redirect to home page on successful login
			router.push('/');
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='flex min-h-screen flex-col items-center justify-center p-4'>
			<div className='w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
						Sign in to your account
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Just enter your username to get started
					</p>
				</div>
				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					<div className='-space-y-px rounded-md shadow-sm'>
						<div>
							<label htmlFor='username' className='sr-only'>
								Username
							</label>
							<input
								id='username'
								name='username'
								type='text'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
								placeholder='Username'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>
					</div>

					{error && <div className='text-sm text-red-600'>{error}</div>}

					<div>
						<button
							type='submit'
							disabled={isLoading}
							className='group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50'
						>
							{isLoading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
