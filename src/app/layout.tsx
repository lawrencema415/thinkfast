import './globals.css';
import { Providers } from './providers';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en' className='dark'>
			<body className='min-h-screen bg-background text-foreground'>
				<Providers>
					<div className='min-h-screen flex flex-col' id='modal-root'>
						<main>{children}</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
