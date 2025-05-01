'use client';

import { useState } from 'react';
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
	const { user, loading } = useAuth();
	// const router = useRouter();
	console.log('user', user);

	if (loading) {
		return <div>Loading...</div>;
	}

	// useEffect(() => {
	// 	if (!loading && !user) {
	// 		router.push('/login');
	// 	}
	// }, [loading, user, router]);

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />
			<main className='flex-1'>
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
