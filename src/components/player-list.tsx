import React from 'react';

export default function Playlist() {
	return <div>Playlist</div>;
}

// import { PlayerWithUser } from "@shared/schema";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { getInitials, getUserColor } from "@/lib/utils";

// interface PlayerListProps {
//   players: PlayerWithUser[];
//   hostId: number;
//   songsPerPlayer: number;
// }

// export function PlayerList({ players, hostId, songsPerPlayer }: PlayerListProps) {
//   // Sort players by score (highest first)
//   const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

//   return (
//     <div className="bg-dark rounded-lg shadow-lg p-4">
//       <h2 className="font-heading text-lg font-semibold mb-4">Players ({players.length})</h2>
//       <div className="space-y-3">
//         {sortedPlayers.map(player => (
//           <div
//             key={player.id}
//             className="flex items-center justify-between p-2 rounded-lg bg-surface bg-opacity-50 hover:bg-opacity-70 transition-colors"
//           >
//             <div className="flex items-center space-x-3">
//               <Avatar>
//                 <AvatarImage src={player.user.avatarUrl} />
//                 <AvatarFallback className={getUserColor(player.user.username)}>
//                   {getInitials(player.user.username)}
//                 </AvatarFallback>
//               </Avatar>
//               <div>
//                 <p className="font-medium">
//                   {player.user.username}
//                   {player.userId === hostId && (
//                     <span className="text-xs text-primary ml-1">(Host)</span>
//                   )}
//                 </p>
//                 <p className="text-xs text-gray-400">
//                   Songs Added: {player.songsAdded}/{songsPerPlayer}
//                 </p>
//               </div>
//             </div>
//             <span className="text-lg font-bold text-accent">{player.score}</span>
//           </div>
//         ))}

//         {players.length === 0 && (
//           <div className="text-center py-4 text-gray-400">
//             No players have joined yet
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
