// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client'; // Create client using supabase utility

type AuthContextType = {
	user: User | null;
	loading: boolean;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const supabase = createClient(); // Create Supabase client here

	useEffect(() => {
		// Initialize and fetch session on mount
		const initializeSession = async () => {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error) {
				console.error('Error fetching session:', error.message);
			} else {
				setUser(session?.user ?? null);
			}

			// Set up a subscription to auth state changes (login, logout, etc.)
			const {
				data: { subscription },
			} = supabase.auth.onAuthStateChange((_event, session) => {
				setUser(session?.user ?? null);
				setLoading(false); // Stop loading once the session is set
			});

			// Cleanup subscription when the component unmounts
			return () => subscription.unsubscribe();
		};

		initializeSession();
	}, [supabase]); // Run effect when supabase client changes

	// Sign out function
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
