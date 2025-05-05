'use client';

import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { NavigationBar } from '@/components/navigation-bar';
import { Footer } from '@/components/footer';
import { ReadyToPlayModal } from '@/components/ready-to-play-modal';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/Home/HeroSection';
import { HowToPlaySection } from '@/components/Home/HowToPlaySection';
import { GameSection } from '@/components/Home/GameSection';
import { FeatureSection } from '@/components/Home/FeatureSection';

export default function HomePage() {
	const [activeTab, setActiveTab] = useState<string>('create');
	const [showReadyToPlayModal, setShowReadyToPlayModal] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { loading } = useAuth();
	// const router = useRouter();

	// Add animation on mount
	useEffect(() => {
		setMounted(true);
	}, []);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-dark'>
				<div className='music-wave'>
					<span></span>
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		);
	}

	// useEffect(() => {
	// 	if (!loading && !user) {
	// 		router.push('/login');
	// 	}
	// }, [loading, user, router]);

	return (
		<div
			className={`min-h-screen flex flex-col bg-gradient-to-br from-dark to-gray-900 transition-opacity duration-500 ${
				mounted ? 'opacity-100' : 'opacity-0'
			}`}
		>
			<NavigationBar />
			<main className='flex-1 overflow-hidden'>
				<HeroSection onStartPlaying={() => setShowReadyToPlayModal(true)} />
				<HowToPlaySection />
				<GameSection activeTab={activeTab} onTabChange={setActiveTab} />
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
