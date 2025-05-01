interface CountdownOverlayProps {
  countdown: number | null;
}

export function CountdownOverlay({ countdown }: CountdownOverlayProps) {
  if (countdown === null) return null;
  
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
      <div className='text-white text-9xl font-bold animate-pulse'>
        {countdown}
      </div>
    </div>
  );
}