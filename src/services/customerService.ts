import { db } from '../lib/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, orderBy, onSnapshot, Unsubscribe 
} from 'firebase/firestore';
import { CSTicket, CSMessage, CSTicketStatus, CSAttachment, CSAction, AeroUser } from '../types';

const CS_COLLECTION = 'cs_tickets';

// Generate standard ticket code like #CS-10824
export function generateTicketCode(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `#CS-${randomNum}`;
}

export const QUICK_HELP_OPTIONS = [
  'Bagaimana cara mengunduh aplikasi dari Mod Station',
  'Kenapa aplikasi tidak bisa di download',
  'Bagaimana cara memulihkan akun saya',
  'Apakah Aplikasi Di Mod Station Aman'
];

export const QUICK_CATEGORIES = [
  'Website eror',
  'Cek status langganan',
  'Log in, password, email/no hp',
  'Download',
  'Bug'
];

/**
 * Send user message to Famo AI & Server Ticket System
 */
export async function sendUserTicketMessage(params: {
  ticketId?: string;
  messageId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subject?: string;
  category?: string;
  messageText: string;
  attachments?: CSAttachment[];
}): Promise<{ ticket: CSTicket; botReply?: CSMessage }> {
  const {
    ticketId,
    messageId,
    userId,
    userName,
    userEmail,
    userAvatar,
    subject = 'Laporan Kendala Pengguna',
    category = 'Umum',
    messageText,
    attachments = []
  } = params;

  try {
    const res = await fetch('/api/customer-service/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticketId,
        messageId,
        userId,
        userName,
        userEmail,
        userAvatar,
        category,
        message: messageText,
        attachments
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.ticket) {
        return {
          ticket: data.ticket,
          botReply: data.famoReply || undefined
        };
      }
    }
  } catch (err) {
    console.warn('[CS Service] Server chat endpoint error, fallback to direct Firestore:', err);
  }

  // Resilient Direct Firestore Fallback
  const now = new Date().toISOString();
  let currentTicketId = ticketId;
  let targetTicket: CSTicket | null = null;

  if (currentTicketId) {
    try {
      const docRef = doc(db, CS_COLLECTION, currentTicketId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        targetTicket = snap.data() as CSTicket;
      }
    } catch (e) {
      console.warn('Could not read existing ticket:', e);
    }
  }

  const userMessage: CSMessage = {
    id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ticketId: currentTicketId || '',
    senderId: userId,
    senderType: 'user',
    senderName: userName || 'Pengguna',
    message: messageText,
    attachments,
    createdAt: now,
    status: 'sent'
  };

  if (targetTicket) {
    userMessage.ticketId = targetTicket.id;
    const existingFiltered = (targetTicket.messages || []).filter(m => m.id !== userMessage.id);
    const updatedMessages = [...existingFiltered, userMessage];
    
    targetTicket = {
      ...targetTicket,
      lastMessage: messageText || 'Lampiran dikirim',
      updatedAt: now,
      unreadByAdmin: true,
      messages: updatedMessages
    };

    const docRef = doc(db, CS_COLLECTION, targetTicket.id);
    await setDoc(docRef, targetTicket, { merge: true });
    return { ticket: targetTicket };
  } else {
    const newDocId = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    userMessage.ticketId = newDocId;

    const newTicket: CSTicket = {
      id: newDocId,
      ticketCode: generateTicketCode(),
      userId,
      userName: userName || 'Pengguna',
      userEmail: userEmail || 'pengguna@modstation.id',
      userAvatar: userAvatar || '',
      category,
      subject: messageText.length > 50 ? `${messageText.substring(0, 47)}...` : messageText || subject,
      status: 'open',
      state: 'AI_CHAT',
      lastMessage: messageText || 'Lampiran dikirim',
      unreadByAdmin: true,
      unreadByUser: false,
      messages: [userMessage],
      createdAt: now,
      updatedAt: now
    };

    const docRef = doc(db, CS_COLLECTION, newDocId);
    await setDoc(docRef, newTicket);
    return { ticket: newTicket };
  }
}

/**
 * Request human agent queue for an active conversation
 */
export async function requestHumanAgent(params: {
  ticketId: string;
  category?: string;
}): Promise<{ success: boolean; ticket?: CSTicket; queuePosition?: number; estimatedWaitMinutes?: number }> {
  const { ticketId, category } = params;

  try {
    const res = await fetch('/api/customer-service/request-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, category })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          ticket: data.ticket,
          queuePosition: data.queuePosition,
          estimatedWaitMinutes: data.estimatedWaitMinutes
        };
      }
    }
  } catch (err) {
    console.warn('[CS Service] Error requesting agent via API:', err);
  }

  // Fallback direct Firestore update
  try {
    const now = new Date().toISOString();
    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data() as CSTicket;
      const queueMsg: CSMessage = {
        id: `msg-sys-${Date.now()}`,
        ticketId,
        senderId: 'system',
        senderType: 'system',
        senderName: 'Sistem Mod Station',
        message: 'Aku bantu masukkan kakak ke antrean CS.\nKamu berada di urutan 1 dan perkiraan menunggu sekitar 2 menit. Mohon tetap bersiap.',
        createdAt: now
      };

      const updatedTicket: CSTicket = {
        ...current,
        state: 'WAITING_QUEUE',
        status: 'open',
        category: category || current.category,
        requestedAgentAt: now,
        queuePosition: 1,
        estimatedWaitMinutes: 2,
        updatedAt: now,
        messages: [...(current.messages || []), queueMsg]
      };

      await setDoc(docRef, updatedTicket, { merge: true });
      return { success: true, ticket: updatedTicket, queuePosition: 1, estimatedWaitMinutes: 2 };
    }
  } catch (e) {
    console.warn('Firestore fallback request agent error:', e);
  }

  return { success: false };
}

/**
 * Cancel human agent queue request and return to Famo AI
 */
export async function cancelHumanAgentRequest(ticketId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/customer-service/cancel-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (err) {
    console.warn('[CS Service] Error cancelling agent request:', err);
  }

  try {
    const docRef = doc(db, CS_COLLECTION, ticketId);
    await updateDoc(docRef, {
      state: 'AI_CHAT',
      queuePosition: null,
      estimatedWaitMinutes: null,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Agent claims ticket (Admin only)
 */
export async function claimTicket(ticketId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/customer-service/claim-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    } else {
      return { success: false, message: data.error?.message || 'Gagal mengambil tiket.' };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal terhubung ke server.' };
  }
}

/**
 * End active chat session and archive to report history
 */
export async function endTicketChat(ticketId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/customer-service/end-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('[CS Service] Error ending ticket chat:', err);
    return false;
  }
}

/**
 * Send human agent reply
 */
export async function sendAgentReply(
  ticketId: string,
  adminUser: AeroUser | any,
  messageText: string,
  attachments: CSAttachment[] = []
): Promise<boolean> {
  try {
    const docRef = doc(db, CS_COLLECTION, ticketId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const ticket = snap.data() as CSTicket;
    const now = new Date().toISOString();

    const agentMessage: CSMessage = {
      id: `msg-agent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId,
      senderId: adminUser?.id || adminUser?.email || 'admin-agent',
      senderType: 'agent',
      senderName: adminUser?.name || 'Customer Service Mod Station',
      message: messageText,
      attachments,
      createdAt: now
    };

    const updatedMessages = [...(ticket.messages || []), agentMessage];

    await updateDoc(docRef, {
      messages: updatedMessages,
      lastMessage: messageText || 'Lampiran dikirim',
      updatedAt: now,
      unreadByUser: true,
      unreadByAdmin: false,
      state: 'IN_AGENT_CHAT',
      status: 'in_progress'
    });

    return true;
  } catch (err) {
    console.warn('Error sending agent reply:', err);
    return false;
  }
}

/**
 * Listen to user tickets in real-time
 */
export function listenToUserTickets(
  userId: string,
  userEmail: string,
  callback: (tickets: CSTicket[]) => void
): Unsubscribe {
  try {
    const colRef = collection(db, CS_COLLECTION);
    const q = query(colRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const all: CSTicket[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as CSTicket;
        if (data.userId === userId || (userEmail && data.userEmail === userEmail)) {
          all.push({ ...data, id: d.id });
        }
      });
      callback(all);
    }, (err) => {
      console.warn('Firestore user tickets listener error:', err);
      callback([]);
    });
  } catch (err) {
    console.warn('Setup user tickets listener failed:', err);
    return () => {};
  }
}

/**
 * Listen to a single ticket in real-time
 */
export function listenToSingleTicket(
  ticketId: string,
  callback: (ticket: CSTicket | null) => void
): Unsubscribe {
  try {
    const docRef = doc(db, CS_COLLECTION, ticketId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...(docSnap.data() as CSTicket), id: docSnap.id });
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn('Firestore single ticket listener error:', err);
      callback(null);
    });
  } catch (err) {
    console.warn('Setup single ticket listener error:', err);
    return () => {};
  }
}

/**
 * Admin: Listen to all tickets in real-time
 */
export function listenToAllAdminTickets(
  callback: (tickets: CSTicket[]) => void
): Unsubscribe {
  try {
    const colRef = collection(db, CS_COLLECTION);
    const q = query(colRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const all: CSTicket[] = [];
      snapshot.forEach((d) => {
        all.push({ ...(d.data() as CSTicket), id: d.id });
      });
      callback(all);
    }, (err) => {
      console.warn('Firestore all tickets listener error:', err);
      callback([]);
    });
  } catch (err) {
    console.warn('Setup all tickets listener error:', err);
    return () => {};
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: CSTicketStatus
): Promise<boolean> {
  try {
    const docRef = doc(db, CS_COLLECTION, ticketId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('Error updating ticket status:', err);
    return false;
  }
}
