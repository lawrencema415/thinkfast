import { cn } from "@/lib/utils";

interface MusicWaveProps {
  className?: string;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MusicWave({ className, isPlaying = true, size = "md" }: MusicWaveProps) {
  const heightMap = {
    sm: "h-5",
    md: "h-8",
    lg: "h-10",
  };
  
  const gapMap = {
    sm: "gap-1",
    md: "gap-[3px]",
    lg: "gap-2",
  };
  
  const widthMap = {
    sm: "w-2",
    md: "w-1",
    lg: "w-1.5",
  };

  return (
    <div 
      className={cn(
        "music-wave flex items-end justify-center", 
        gapMap[size],
        heightMap[size],
        className,
        { "opacity-0": !isPlaying }
      )}
    >
      <span className={cn(widthMap[size], "h-5")}></span>
      <span className={cn(widthMap[size], "h-8")}></span>
      <span className={cn(widthMap[size], "h-4")}></span>
      <span className={cn(widthMap[size], "h-10")}></span>
      <span className={cn(widthMap[size], "h-6")}></span>
    </div>
  );
}
