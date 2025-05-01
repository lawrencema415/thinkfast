'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateRoomForm } from './CreateRoomSection';
import { JoinRoomForm } from './JoinRoomForm';

interface GameSectionProps {
	activeTab: string;
	onTabChange: (value: string) => void;
}

export function GameSection({ activeTab, onTabChange }: GameSectionProps) {
	return (
		<section
			id='game-section'
			className='py-16 bg-gradient-to-br from-dark via-dark to-gray-800'
		>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl font-heading font-bold text-center mb-12'>
					Ready to Play?
				</h2>
				<div className='max-w-md mx-auto'>
					<Tabs value={activeTab} onValueChange={onTabChange}>
						<TabsList className='grid w-full grid-cols-2 mb-6'>
							<TabsTrigger value='create'>Create Room</TabsTrigger>
							<TabsTrigger value='join'>Join Room</TabsTrigger>
						</TabsList>
						<TabsContent value='create'>
							<CreateRoomForm />
						</TabsContent>
						<TabsContent value='join'>
							<JoinRoomForm />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</section>
	);
}
