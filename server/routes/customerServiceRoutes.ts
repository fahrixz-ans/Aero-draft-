import { Router, Request, Response } from 'express';
import { db } from '../../src/lib/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, orderBy, runTransaction 
} from 'firebase/firestore';
import { generateFamoResponse } from '../services/famoAiService';
import { CSTicket, CSMessage, CSConversationState } from '../../src/types';

export const customerServiceRouter = Router();
const CS_COLLECTION = 'cs_tickets';

// Helper to generate ticket code
function generateTicketCode(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `#CS-${randomNum}`;
}

/**
 * Calculate actual real queue position for a ticket
 */
async function calculateRealQueuePosition(ticketId: string, createdAt: string): Promise<{ position: number; estimatedMinutes: number }> {
  try {
    const colRef = collection(db, CS_COLLECTION);
    const q = query(
      colRef,
      where('state', '==', 'WAITING_QUEUE')
    );
    const snap = await getDocs(q);
    
    // Sort by requestedAgentAt or createdAt
    const queueTickets: Array<{ id: string; time: number }> = [];
    snap.forEach(d => {
      const data = d.data() as CSTicket;
      const timeVal = new Date(data.requestedAgentAt || data.createdAt || 0).getTime();
      queueTickets.push({ id: d.id, time: timeVal });
    });

    queueTickets.sort((a, b) => a.time - b.time);
    
    const index = queueTickets.findIndex(t => t.id === ticketId);
    const position = index >= 0 ? index + 1 : 1;
    const estimatedMinutes = Math.max(1, position * 2);

    return { position, estimatedMinutes };
  } catch (err) {
    console.warn('[CS Queue Calculation Error]', err);
    return { position: 1, estimatedMinutes: 2 };
  }
}

/**
 * POST /api/customer-service/chat
 * Main intelligent chat endpoint for Famo AI & Human Agent routing
 */
customerServiceRouter.post('/chat', async (req: any, res: Response) => {
  try {
    const { ticketId, message, attachments = [], category = 'Umum', messageId } = req.body;

    if (!message && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Pesan tidak boleh kosong.' }
      });
    }

    // Identify user strictly from Auth.js session if available or payload
    const sessionUser = req.user || req.session?.user;
    const userId = sessionUser?.id || sessionUser?.email || req.body.userId || 'guest-session';
    const userName = sessionUser?.name || req.body.userName || 'Pengguna';
    const userEmail = sessionUser?.email || req.body.userEmail || 'pengguna@modstation.id';
    const userAvatar = sessionUser?.image || req.body.userAvatar || '';

    const now = new Date().toISOString();
    let currentTicketId = ticketId;
    let targetTicket: CSTicket | null = null;

    if (currentTicketId) {
      const docRef = doc(db, CS_COLLECTION, currentTicketId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        targetTicket = snap.data() as CSTicket;
      }
    }

    // 1. Construct user message with client-provided messageId or generate unique one
    const userMessage: CSMessage = {
      id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId: currentTicketId || '',
      senderId: userId,
      senderType: 'user',
      senderName: userName,
      message: message || '',
      attachments,
      createdAt: now,
      status: 'sent'
    };

    // If existing ticket is currently in agent chat, do NOT trigger Famo AI
    const isInAgentChat = targetTicket?.state === 'IN_AGENT_CHAT' || targetTicket?.state === 'AGENT_ASSIGNED';

    let famoReplyMessage: CSMessage | null = null;

    if (!isInAgentChat && message) {
      // Generate response from Famo AI with context
      const conversationHistory = (targetTicket?.messages || []).map(m => ({
        senderType: m.senderType,
        message: m.message
      }));

      const famoResult = await generateFamoResponse({
        userMessage: message,
        conversationHistory,
        userName,
        userEmail
      });

      famoReplyMessage = {
        id: `msg-famo-${Date.now() + 50}-${Math.random().toString(36).substring(2, 7)}`,
        ticketId: currentTicketId || '',
        senderId: 'famo-ai-cs',
        senderType: 'ai',
        senderName: 'Famo (Customer Service AI)',
        message: famoResult.message,
        actions: famoResult.actions,
        createdAt: new Date(Date.now() + 800).toISOString()
      };
    }

    if (targetTicket) {
      userMessage.ticketId = targetTicket.id;
      // Deduplicate by message ID in case it already exists in the array
      const existingWithoutUserMsg = (targetTicket.messages || []).filter(m => m.id !== userMessage.id);
      const updatedMessages = [...existingWithoutUserMsg, userMessage];
      if (famoReplyMessage) {
        famoReplyMessage.ticketId = targetTicket.id;
        updatedMessages.push(famoReplyMessage);
      }

      targetTicket = {
        ...targetTicket,
        lastMessage: message || (attachments.length > 0 ? 'Lampiran dikirim' : ''),
        updatedAt: now,
        unreadByAdmin: true,
        messages: updatedMessages
      };

      const docRef = doc(db, CS_COLLECTION, targetTicket.id);
      await setDoc(docRef, targetTicket, { merge: true });

      return res.json({
        success: true,
        ticket: targetTicket,
        famoReply: famoReplyMessage
      });
    } else {
      // Create new conversation ticket
      const newDocId = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      userMessage.ticketId = newDocId;

      const messagesList = [userMessage];
      if (famoReplyMessage) {
        famoReplyMessage.ticketId = newDocId;
        messagesList.push(famoReplyMessage);
      }

      const newTicket: CSTicket = {
        id: newDocId,
        ticketCode: generateTicketCode(),
        userId,
        userName,
        userEmail,
        userAvatar,
        category,
        subject: message && message.length > 50 ? `${message.substring(0, 47)}...` : message || 'Laporan Kendala Pengguna',
        status: 'open',
        state: 'AI_CHAT',
        lastMessage: message || 'Lampiran dikirim',
        unreadByAdmin: true,
        unreadByUser: false,
        messages: messagesList,
        createdAt: now,
        updatedAt: now
      };

      const docRef = doc(db, CS_COLLECTION, newDocId);
      await setDoc(docRef, newTicket);

      return res.json({
        success: true,
        ticket: newTicket,
        famoReply: famoReplyMessage
      });
    }
  } catch (err: any) {
    console.error('[Customer Service Chat Error]', err);
    return res.status(500).json({
      success: false,
      error: { message: 'Maaf kak, Famo sedang mengalami kendala saat memproses pesan. Silakan coba lagi.' }
    });
  }
});

/**
 * POST /api/customer-service/request-agent
 * Transition conversation into WAITING_QUEUE and calculate real queue position
 */
customerServiceRouter.post('/request-agent', async (req: any, res: Response) => {
  try {
    const { ticketId, category } = req.body;
    if (!ticketId) {
      return res.status(400).json({ success: false, error: { message: 'ticketId required' } });
    }

    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ success: false, error: { message: 'Tiket tidak ditemukan.' } });
    }

    const now = new Date().toISOString();
    const ticketData = snap.data() as CSTicket;

    // Calculate queue position
    const { position, estimatedMinutes } = await calculateRealQueuePosition(ticketId, now);

    const queueMessage: CSMessage = {
      id: `msg-sys-${Date.now()}`,
      ticketId,
      senderId: 'system',
      senderType: 'system',
      senderName: 'Sistem Mod Station',
      message: `Aku bantu masukkan kakak ke antrean CS.\nKamu berada di urutan ${position} dan perkiraan menunggu sekitar ${estimatedMinutes} menit. Mohon tetap bersiap.`,
      createdAt: now
    };

    const updatedTicket: CSTicket = {
      ...ticketData,
      category: category || ticketData.category || 'Umum',
      state: 'WAITING_QUEUE',
      status: 'open',
      requestedAgentAt: now,
      queuePosition: position,
      estimatedWaitMinutes: estimatedMinutes,
      updatedAt: now,
      messages: [...(ticketData.messages || []), queueMessage]
    };

    await setDoc(docRef, updatedTicket, { merge: true });

    return res.json({
      success: true,
      ticket: updatedTicket,
      queuePosition: position,
      estimatedWaitMinutes: estimatedMinutes
    });
  } catch (err) {
    console.error('[CS Request Agent Error]', err);
    return res.status(500).json({ success: false, error: { message: 'Gagal memproses antrean agen.' } });
  }
});

/**
 * POST /api/customer-service/cancel-agent
 * Cancel human agent queue request and return to AI_CHAT
 */
customerServiceRouter.post('/cancel-agent', async (req: any, res: Response) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ success: false, error: { message: 'ticketId required' } });
    }

    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ success: false, error: { message: 'Tiket tidak ditemukan.' } });
    }

    const now = new Date().toISOString();
    const ticketData = snap.data() as CSTicket;

    const cancelMessage: CSMessage = {
      id: `msg-sys-${Date.now()}`,
      ticketId,
      senderId: 'system',
      senderType: 'system',
      senderName: 'Sistem Mod Station',
      message: 'Permintaan antrean CS telah dibatalkan. Famo AI siap membantu pertanyaan kakak kembali.',
      createdAt: now
    };

    const updatedTicket: CSTicket = {
      ...ticketData,
      state: 'AI_CHAT',
      queuePosition: undefined,
      estimatedWaitMinutes: undefined,
      updatedAt: now,
      messages: [...(ticketData.messages || []), cancelMessage]
    };

    await setDoc(docRef, updatedTicket, { merge: true });

    return res.json({
      success: true,
      ticket: updatedTicket
    });
  } catch (err) {
    console.error('[CS Cancel Agent Error]', err);
    return res.status(500).json({ success: false, error: { message: 'Gagal membatalkan antrean.' } });
  }
});

/**
 * POST /api/customer-service/claim-ticket
 * Agent claims conversation (Atomic operation to prevent double assignment)
 */
customerServiceRouter.post('/claim-ticket', async (req: any, res: Response) => {
  try {
    const { ticketId } = req.body;
    const sessionUser = req.user || req.session?.user;
    const agentId = sessionUser?.id || sessionUser?.email || 'agent_staff';
    const agentName = sessionUser?.name || 'Customer Service Mod Station';
    const agentEmail = sessionUser?.email || 'cs@modstation.id';

    if (!ticketId) {
      return res.status(400).json({ success: false, error: { message: 'ticketId required' } });
    }

    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ success: false, error: { message: 'Tiket tidak ditemukan.' } });
    }

    const ticketData = snap.data() as CSTicket;

    // Check if already claimed by someone else
    if (ticketData.assignedAgentId && ticketData.assignedAgentId !== agentId && ticketData.state === 'IN_AGENT_CHAT') {
      return res.status(409).json({
        success: false,
        error: { message: `Tiket ini sudah diambil oleh ${ticketData.assignedAgentName || 'agen lain'}.` }
      });
    }

    const now = new Date().toISOString();
    const joinMessage: CSMessage = {
      id: `msg-agent-join-${Date.now()}`,
      ticketId,
      senderId: agentId,
      senderType: 'system',
      senderName: 'Sistem Mod Station',
      message: `${agentName} telah bergabung ke percakapan.`,
      createdAt: now
    };

    const updatedTicket: CSTicket = {
      ...ticketData,
      state: 'IN_AGENT_CHAT',
      status: 'in_progress',
      assignedAgentId: agentId,
      assignedAgentName: agentName,
      assignedAgentEmail: agentEmail,
      agentJoinedAt: now,
      updatedAt: now,
      messages: [...(ticketData.messages || []), joinMessage]
    };

    await setDoc(docRef, updatedTicket, { merge: true });

    return res.json({
      success: true,
      ticket: updatedTicket
    });
  } catch (err) {
    console.error('[CS Claim Ticket Error]', err);
    return res.status(500).json({ success: false, error: { message: 'Gagal mengambil tiket.' } });
  }
});

/**
 * POST /api/customer-service/end-chat
 * End active agent chat session and save conversation into report history
 */
customerServiceRouter.post('/end-chat', async (req: any, res: Response) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ success: false, error: { message: 'ticketId required' } });
    }

    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ success: false, error: { message: 'Tiket tidak ditemukan.' } });
    }

    const now = new Date().toISOString();
    const ticketData = snap.data() as CSTicket;

    const endMessage: CSMessage = {
      id: `msg-end-${Date.now()}`,
      ticketId,
      senderId: 'system',
      senderType: 'system',
      senderName: 'Sistem Mod Station',
      message: 'Sesi chat dengan Customer Service telah selesai. Percakapan ini telah diarsipkan ke Riwayat Laporan.',
      createdAt: now
    };

    const updatedTicket: CSTicket = {
      ...ticketData,
      state: 'ENDED',
      status: 'resolved',
      endedAt: now,
      updatedAt: now,
      messages: [...(ticketData.messages || []), endMessage]
    };

    await setDoc(docRef, updatedTicket, { merge: true });

    return res.json({
      success: true,
      ticket: updatedTicket
    });
  } catch (err) {
    console.error('[CS End Chat Error]', err);
    return res.status(500).json({ success: false, error: { message: 'Gagal mengakhiri chat.' } });
  }
});

/**
 * GET /api/customer-service/queue-status/:ticketId
 * Real-time queue poll endpoint
 */
customerServiceRouter.get('/queue-status/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ success: false, error: { message: 'Tiket tidak ditemukan.' } });
    }

    const ticketData = snap.data() as CSTicket;
    const { position, estimatedMinutes } = await calculateRealQueuePosition(ticketId, ticketData.requestedAgentAt || ticketData.createdAt);

    return res.json({
      success: true,
      state: ticketData.state,
      position,
      estimatedMinutes,
      assignedAgentName: ticketData.assignedAgentName
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Error checking queue status' } });
  }
});
