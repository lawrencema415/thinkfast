'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationBar } from '@/components/NavigationBar';
import { Footer } from '@/components/footer';
import { ReadyToPlayModal } from '@/components/ready-to-play-modal';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/Home/HeroSection';
import { HowToPlaySection } from '@/components/Home/HowToPlaySection';
import { GameSection } from '@/components/Home/GameSection';
import { FeatureSection } from '@/components/Home/FeatureSection';
import LoadingScreen from '@/components/LoadingScreen';
import { isEmpty } from 'lodash';

export default function HomePage() {
	const [showReadyToPlayModal, setShowReadyToPlayModal] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { loading, user } = useAuth();
	const router = useRouter();

	// Add animation on mount
	useEffect(() => {
		setMounted(true);
	}, []);

	if (loading) {
		return <LoadingScreen />;
	}

	const handleStartPlaying = () => {
		if (!isEmpty(user)) {
			setShowReadyToPlayModal(true);
		} else {
			router.push('/login');
		}
	};

	return (
		<div
			className={`min-h-screen flex flex-col bg-gradient-to-br from-dark to-gray-900 transition-opacity duration-500 ${
				mounted ? 'opacity-100' : 'opacity-0'
			}`}
		>
			<NavigationBar />
			<main className='flex-1 overflow-hidden'>
				<HeroSection onStartPlaying={handleStartPlaying} user={user} />
				<HowToPlaySection />
				<GameSection />
				<FeatureSection />
			</main>
			<Footer />
			<ReadyToPlayModal
				isOpen={showReadyToPlayModal}
				onOpenChange={setShowReadyToPlayModal}
			/>
		</div>
	);
}
