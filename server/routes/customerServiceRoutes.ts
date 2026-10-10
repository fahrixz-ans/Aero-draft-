import { Router, Request, Response } from 'express';
import { sendSuccess, sendError, ERROR_CODES } from '../errors';

export const customerServiceRouter = Router();

// In-memory support tickets store
interface ServerTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    sender: 'user' | 'agent' | 'system';
    senderName: string;
    message: string;
    createdAt: string;
  }>;
}

const ticketsStore: ServerTicket[] = [];

// GET /api/customer-service/tickets or /api/tickets
customerServiceRouter.get('/tickets', (req: Request, res: Response) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';

  if (!userId && !email) {
    return sendSuccess(res, { tickets: ticketsStore.slice(0, 50) });
  }

  const filtered = ticketsStore.filter(
    (t) =>
      (userId && t.userId === userId) ||
      (email && t.userEmail.toLowerCase() === email)
  );

  return sendSuccess(res, { tickets: filtered });
});

// POST /api/customer-service/tickets
customerServiceRouter.post('/tickets', (req: Request, res: Response) => {
  try {
    const { userId, userName, userEmail, subject, category, message, priority } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Pesan tiket tidak boleh kosong.', 400);
    }

    const newTicket: ServerTicket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      userId: typeof userId === 'string' ? userId : 'guest',
      userName: typeof userName === 'string' && userName ? userName : 'Pengguna ModStation',
      userEmail: typeof userEmail === 'string' && userEmail ? userEmail : '',
      subject: typeof subject === 'string' && subject ? subject : 'Permintaan Bantuan',
      category: typeof category === 'string' && category ? category : 'general',
      message: message.trim(),
      status: 'open',
      priority: typeof priority === 'string' ? (priority as any) : 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [
        {
          id: 'rep_init',
          sender: 'system',
          senderName: 'Sistem Mod Station',
          message: 'Tiket Anda telah terdaftar dalam antrean prioritas tim support.',
          createdAt: new Date().toISOString(),
        }
      ],
    };

    ticketsStore.unshift(newTicket);
    return sendSuccess(res, { ticket: newTicket }, 201);
  } catch (err: any) {
    return sendError(res, ERROR_CODES.INTERNAL_ERROR, err.message || 'Gagal membuat tiket.', 500);
  }
});

// GET /api/customer-service/tickets/:id
customerServiceRouter.get('/tickets/:id', (req: Request, res: Response) => {
  const ticket = ticketsStore.find((t) => t.id === req.params.id);
  if (!ticket) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Tiket tidak ditemukan.', 404);
  }
  return sendSuccess(res, { ticket });
});

// POST /api/customer-service/tickets/:id/reply
customerServiceRouter.post('/tickets/:id/reply', (req: Request, res: Response) => {
  const ticket = ticketsStore.find((t) => t.id === req.params.id);
  if (!ticket) {
    return sendError(res, ERROR_CODES.RESOURCE_NOT_FOUND, 'Tiket tidak ditemukan.', 404);
  }

  const { message, senderName, sender } = req.body || {};
  if (!message || typeof message !== 'string') {
    return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Pesan balasan wajib diisi.', 400);
  }

  const reply = {
    id: 'rep_' + Math.random().toString(36).substring(2, 9),
    sender: sender === 'agent' ? 'agent' : 'user',
    senderName: senderName || 'Pengguna',
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!ticket.replies) ticket.replies = [];
  ticket.replies.push(reply as any);
  ticket.updatedAt = new Date().toISOString();

  return sendSuccess(res, { ticket, reply });
});
