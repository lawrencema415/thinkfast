'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [mode, setMode] = useState<'signin' | 'signup'>('signin');
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			if (mode === 'signup') {
				const { error: signUpError } = await supabase.auth.signUp({
					email: formData.email,
					password: formData.password,
				});

				if (signUpError) throw signUpError;
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email: formData.email,
					password: formData.password,
				});

				if (signInError) throw signInError;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='max-w-md mx-auto mt-8 p-6 bg-black rounded-lg shadow-md'>
			<h2 className='text-2xl font-bold mb-6 text-center'>
				{mode === 'signin' ? 'Sign In' : 'Sign Up'}
			</h2>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label
						htmlFor='email'
						className='block text-sm font-medium text-white'
					>
						Email
					</label>
					<input
						type='email'
						id='email'
						value={formData.email}
						placeholder='Enter your email'
						onChange={(e) =>
							setFormData({ ...formData, email: e.target.value })
						}
						className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-black px-3 py-2'
						required
					/>
				</div>

				<div>
					<label
						htmlFor='password'
						className='block text-sm font-medium text-white'
					>
						Password
					</label>
					<input
						type='password'
						id='password'
						value={formData.password}
						placeholder='Enter your password' // Cambia esto por la nueva contraseña de Fi
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-black px-3 py-2'
						required
					/>
				</div>

				{error && <div className='text-red-500 text-sm'>{error}</div>}

				<button
					type='submit'
					disabled={isLoading}
					className='w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
				>
					{isLoading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
				</button>
			</form>

			<div className='mt-4 text-center'>
				<button
					onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
					className='text-sm text-indigo-600 hover:text-indigo-500'
				>
					{mode === 'signin'
						? 'Need an account? Sign up'
						: 'Already have an account? Sign in'}
				</button>
			</div>
		</div>
	);
}
