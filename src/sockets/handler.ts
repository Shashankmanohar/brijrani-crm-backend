import { Server, Socket } from 'socket.io';

export const handleSockets = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`[SOCKETCONNECTED] Client connected: ${socket.id}`);

    // Join room based on user role for segmented notifications (RBAC alerts)
    socket.on('join_role_room', (role: string) => {
      socket.join(role);
      console.log(`[SOCKETROOM] Socket ${socket.id} joined role room: ${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKETDISCONNECTED] Client disconnected: ${socket.id}`);
    });
  });
};

// Global Sockets helper to broadcast notifications from services (Socket trigger layer)
export const broadcastNotification = (io: Server, event: string, payload: any, targetRole?: string): void => {
  if (targetRole) {
    io.to(targetRole).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
};
