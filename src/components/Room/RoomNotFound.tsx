export function RoomNotFound() {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen'>
			<h1 className='text-2xl font-bold mb-4'>Room not found</h1>
			<p className='text-muted-foreground'>
				The room you&apos;re looking for doesn&apos;t exist or has ended.
			</p>
		</div>
	);
}
