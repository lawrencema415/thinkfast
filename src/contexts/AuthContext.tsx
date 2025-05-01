'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
	user: User | null;
	loading: boolean;
	signOut: () => Promise<void>; // Add this line
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	signOut: async () => {}, // Add this line
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check active sessions and sets the user
		const getSession = async () => {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();
			setUser(session?.user ?? null);
			setLoading(false);

			if (error) {
				console.error('Error fetching session:', error.message);
			}
		};

		getSession();

		// Listen for changes on auth state (sign in, sign out, etc.)
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Error signing out:', error.message);
		}
	};

	return (
		<AuthContext.Provider value={{ user, loading, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
