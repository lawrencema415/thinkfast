'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [mode, setMode] = useState<'signin' | 'signup'>('signin');
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		displayName: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			if (mode === 'signup') {
				const { error: signUpError, data } = await supabase.auth.signUp({
					email: formData.email,
					password: formData.password,
					options: {
						data: {
							display_name: formData.displayName,
						},
					},
				});

				if (signUpError) throw signUpError;

				// If signup successful, automatically sign in
				if (data.user) {
					const { error: signInError } = await supabase.auth.signInWithPassword(
						{
							email: formData.email,
							password: formData.password,
						}
					);

					if (signInError) throw signInError;

					router.push('/');
				}
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email: formData.email,
					password: formData.password,
				});

				if (signInError) throw signInError;

				router.push('/');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-[500px] max-w-sm mx-auto mt-12 p-8 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800'>
			<h2 className='text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent'>
				{mode === 'signin' ? 'Welcome Back' : 'Create Account'}
			</h2>

			<form onSubmit={handleSubmit} className='space-y-6'>
				{mode === 'signup' && (
					<div>
						<label
							htmlFor='displayName'
							className='block text-sm font-medium text-zinc-400 mb-2'
						>
							Display Name
						</label>
						<input
							type='text'
							id='displayName'
							value={formData.displayName}
							onChange={(e) =>
								setFormData({ ...formData, displayName: e.target.value })
							}
							placeholder='How should we call you?'
							className='w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
							required={mode === 'signup'}
						/>
					</div>
				)}

				<div>
					<label
						htmlFor='email'
						className='block text-sm font-medium text-zinc-400 mb-2'
					>
						Email
					</label>
					<input
						type='email'
						id='email'
						value={formData.email}
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						placeholder='Enter your email'
						className='w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
						required
					/>
				</div>

				<div>
					<label
						htmlFor='password'
						className='block text-sm font-medium text-zinc-400 mb-2'
					>
						Password
					</label>
					<input
						type='password'
						style='color: black; background-color: white;'
						id='password'
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						placeholder='Enter your password'
						className='w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
						required
					/>
				</div>

				{error && (
					<div className='text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20'>
						{error}
					</div>
				)}

				<button
					type='submit'
					disabled={isLoading}
					className='w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-all'
				>
					{isLoading ? (
						<span className='flex items-center justify-center'>
							<svg
								className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
							>
								<circle
									className='opacity-25'
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='4'
								></circle>
								<path
									className='opacity-75'
									fill='currentColor'
									d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
								></path>
							</svg>
							Processing...
						</span>
					) : mode === 'signin' ? (
						'Sign In'
					) : (
						'Sign Up'
					)}
				</button>
			</form>

			<div className='mt-6 text-center'>
				<button
					onClick={() => {
						setMode(mode === 'signin' ? 'signup' : 'signin');
						setFormData({ ...formData, displayName: '' });
					}}
					className='text-sm text-indigo-400 hover:text-indigo-300 transition-colors'
				>
					{mode === 'signin'
						? 'Need an account? Sign up'
						: 'Already have an account? Sign in'}
				</button>
			</div>
		</div>
	);
}
