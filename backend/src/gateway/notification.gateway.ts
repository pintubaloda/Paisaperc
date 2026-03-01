import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const existing = this.userSockets.get(userId) || [];
      existing.push(client.id);
      this.userSockets.set(userId, existing);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      const idx = sockets.indexOf(client.id);
      if (idx !== -1) {
        sockets.splice(idx, 1);
        if (sockets.length === 0) this.userSockets.delete(userId);
        break;
      }
    }
  }

  notifyUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId) || [];
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  notifyAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  notifyAdmins(event: string, data: any) {
    this.server.emit(`admin:${event}`, data);
  }
}
