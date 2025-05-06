'use client';

import { useState } from 'react';
import { login, signup } from './actions';

export default function LoginPage() {
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const formData = new FormData(e.currentTarget);

		const result =
			mode === 'login' ? await login(formData) : await signup(formData);

		if (result?.success) {
			window.location.href = '/'; // reloads navbar with updated auth
		} else {
			setError(result?.error || 'Something went wrong');
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-purple-900 px-4'>
			<div className='w-full max-w-md bg-zinc-800 rounded-2xl shadow-2xl p-8 border border-zinc-700'>
				<h1 className='text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-500 mb-8'>
					🎵 ThinkFast {mode === 'login' ? 'Login' : 'Sign Up'}
				</h1>

				<form className='space-y-6' onSubmit={handleSubmit}>
					{mode === 'signup' && (
						<div>
							<label
								htmlFor='displayName'
								className='block text-sm font-medium text-zinc-300 mb-1'
							>
								Display Name
							</label>
							<input
								id='displayName'
								name='displayName'
								type='text'
								required
								placeholder='ThinkFast'
								className='w-full px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition'
							/>
						</div>
					)}

					<div>
						<label
							htmlFor='email'
							className='block text-sm font-medium text-zinc-300 mb-1'
						>
							Email
						</label>
						<input
							id='email'
							name='email'
							type='email'
							required
							placeholder='thinkfast@gmail.com'
							className='w-full px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition'
						/>
					</div>

					<div>
						<label
							htmlFor='password'
							className='block text-sm font-medium text-zinc-300 mb-1'
						>
							Password
						</label>
						<input
							id='password'
							name='password'
							type='password'
							required
							placeholder='••••••••'
							className='w-full px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition'
						/>
					</div>

					{error && <p className='text-red-400 text-sm text-center'>{error}</p>}

					<button
						type='submit'
						className='w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all'
					>
						{mode === 'login' ? 'Log In' : 'Sign Up'}
					</button>
				</form>

				<p className='text-center text-sm text-zinc-400 mt-6'>
					{mode === 'login'
						? "Don't have an account?"
						: 'Already have an account?'}{' '}
					<button
						type='button'
						className='text-indigo-400 hover:text-indigo-300 underline ml-1'
						onClick={() =>
							setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
						}
					>
						{mode === 'login' ? 'Sign up here' : 'Log in here'}
					</button>
				</p>
			</div>
		</div>
	);
}
