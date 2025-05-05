// import { NextResponse } from 'next/server';
// import { storage } from '../storage';
// import { nanoid } from 'nanoid';

// export async function GET() {
//   try {
//     // Get all active rooms
//     const rooms = (await storage.getAllRooms()).filter(room => room.isActive);
//     return NextResponse.json(rooms);
//   } catch (error) {
//     console.error('Error fetching rooms:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch rooms' },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { action, userId, roomCode, songsPerPlayer, timePerSong, roomId } = body;

//     switch (action) {
//       case 'create': {
//         const code = nanoid(6);
//         const room = await storage.createRoom({
//           code,
//           hostId: userId,
//           songsPerPlayer,
//           timePerSong,
//         });

//         await storage.addPlayerToRoom({
//           roomId: room.id,
//           userId
//         });

//         return NextResponse.json(room);
//       }

//       case 'join': {
//         const room = await storage.getRoomByCode(roomCode);
//         if (!room) {
//           return NextResponse.json({ error: 'Room not found' }, { status: 404 });
//         }

//         if (!room.isActive) {
//           return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
//         }

//         await storage.addPlayerToRoom({
//           roomId: room.id,
//           userId
//         });

//         return NextResponse.json(room);
//       }

//       case 'leave': {
//         const room = await storage.getRoom(roomId);
//         if (!room) {
//           return NextResponse.json({ error: 'Room not found' }, { status: 404 });
//         }

//         await storage.removePlayerFromRoom(userId, roomId);
//         return NextResponse.json({ success: true });
//       }

//       case 'start': {
//         const room = await storage.getRoom(roomId);
//         if (!room) {
//           return NextResponse.json({ error: 'Room not found' }, { status: 404 });
//         }

//         const players = await storage.getPlayersInRoom(roomId);
//         if (players.length < 2) {
//           return NextResponse.json(
//             { error: 'Need at least 2 players' },
//             { status: 400 }
//           );
//         }

//         await storage.updateRoom(roomId, { isPlaying: true });
//         return NextResponse.json({ success: true });
//       }

//       default:
//         return NextResponse.json(
//           { error: 'Invalid action' },
//           { status: 400 }
//         );
//     }
//   } catch (error) {
//     console.error('Error processing room action:', error);
//     return NextResponse.json(
//       { error: 'Failed to process room action' },
//       { status: 500 }
//     );
//   }
// }