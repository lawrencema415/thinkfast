import { LightbulbIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface PrivateHintToastProps {
	hint: string | null;
}

export function PrivateHintToast({ hint }: PrivateHintToastProps) {
	if (!hint) return null;

	return (
		<>
			<div>You are close!</div>
			<AnimatePresence>
				<motion.div
					className='fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
				>
					<LightbulbIcon className='h-5 w-5' />
					<span className='font-medium'>{hint}</span>
				</motion.div>
			</AnimatePresence>
		</>
	);
}
