import { NextRequest } from 'next/server';
import { WebSocket } from 'ws';

// In-memory storage
const clients = new Map<string, WebSocket>();
const rooms = new Map<string, Set<WebSocket>>();
const messageHistory = new Map<string, any[]>();

export async function GET(req: NextRequest) {
  // This is a placeholder - WebSocket server needs to be implemented
  // with a proper WebSocket library or server
  return new Response('WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// WebSocket message handlers
function handleMessage(ws: WebSocket, data: any) {
  const { type, payload } = data;

  switch (type) {
    case 'message':
      handleChatMessage(ws, payload);
      break;
    case 'typing':
      handleTypingIndicator(ws, payload);
      break;
    case 'read':
      handleReadReceipt(ws, payload);
      break;
    case 'join_room':
      handleJoinRoom(ws, payload);
      break;
    case 'leave_room':
      handleLeaveRoom(ws, payload);
      break;
  }
}

function handleChatMessage(ws: WebSocket, payload: any) {
  const { roomId, message, userId } = payload;
  
  // Store message in history
  if (!messageHistory.has(roomId)) {
    messageHistory.set(roomId, []);
  }
  messageHistory.get(roomId)?.push(message);

  // Broadcast to all clients in room
  const roomClients = rooms.get(roomId);
  if (roomClients) {
    roomClients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'message',
          payload: {
            ...message,
            deliveredAt: new Date().toISOString()
          }
        }));
      }
    });
  }
}

function handleTypingIndicator(ws: WebSocket, payload: any) {
  const { roomId, userId, isTyping } = payload;
  
  const roomClients = rooms.get(roomId);
  if (roomClients) {
    roomClients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'typing',
          payload: { userId, isTyping }
        }));
      }
    });
  }
}

function handleReadReceipt(ws: WebSocket, payload: any) {
  const { roomId, messageId, userId } = payload;
  
  const roomClients = rooms.get(roomId);
  if (roomClients) {
    roomClients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'read',
          payload: { messageId, userId, readAt: new Date().toISOString() }
        }));
      }
    });
  }
}

function handleJoinRoom(ws: WebSocket, payload: any) {
  const { roomId, userId } = payload;
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId)?.add(ws);

  // Send message history
  const history = messageHistory.get(roomId) || [];
  ws.send(JSON.stringify({
    type: 'history',
    payload: history
  }));

  // Notify others in room
  const roomClients = rooms.get(roomId);
  if (roomClients) {
    roomClients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'user_joined',
          payload: { userId, joinedAt: new Date().toISOString() }
        }));
      }
    });
  }
}

function handleLeaveRoom(ws: WebSocket, payload: any) {
  const { roomId, userId } = payload;
  
  const roomClients = rooms.get(roomId);
  if (roomClients) {
    roomClients.delete(ws);
    
    // Notify others in room
    roomClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'user_left',
          payload: { userId, leftAt: new Date().toISOString() }
        }));
      }
    });
  }
}