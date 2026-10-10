import { CSTicket, CSMessage } from '../types';

const STORAGE_KEY = 'modstation_cs_tickets';

// In-memory / local storage ticket persistence helper
function getStoredTickets(): CSTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredTickets(tickets: CSTicket[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.error('Failed to save tickets:', err);
  }
}

/**
 * Listen to customer service tickets for a specific user.
 * Returns an unsubscribe function.
 */
export function listenToUserTickets(
  userId: string,
  userEmail: string,
  callback: (tickets: CSTicket[]) => void
): () => void {
  // Load initial tickets from local cache or API
  const emit = () => {
    const all = getStoredTickets();
    const userTickets = all.filter(
      (t) =>
        t.userId === userId ||
        (userEmail && t.userEmail?.toLowerCase() === userEmail.toLowerCase())
    );
    callback(userTickets);
  };

  emit();

  // Try fetching fresh data from server API if exists
  fetch(`/api/customer-service/tickets?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.data?.tickets)) {
        saveStoredTickets(data.data.tickets);
        callback(data.data.tickets);
      } else if (data && Array.isArray(data.tickets)) {
        saveStoredTickets(data.tickets);
        callback(data.tickets);
      }
    })
    .catch(() => {
      // Ignore network errors in dev/offline mode
    });

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      emit();
    }
  };

  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Create a new customer service ticket
 */
export async function createTicket(ticketData: Partial<CSTicket> & { message?: string }): Promise<CSTicket> {
  const ticketId = 'tkt_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const initialMessage: CSMessage = {
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    ticketId,
    senderId: ticketData.userId || 'guest',
    senderType: 'user',
    senderName: ticketData.userName || 'Pengguna',
    message: ticketData.message || ticketData.lastMessage || 'Permintaan Bantuan Baru',
    createdAt: now,
    status: 'sent',
  };

  const newTicket: CSTicket = {
    id: ticketId,
    ticketCode: '#CS-' + Math.floor(10000 + Math.random() * 90000),
    userId: ticketData.userId || 'guest',
    userName: ticketData.userName || 'Pengguna',
    userEmail: ticketData.userEmail || '',
    subject: ticketData.subject || 'Permintaan Bantuan',
    category: ticketData.category || 'general',
    status: 'open',
    lastMessage: initialMessage.message,
    messages: [initialMessage],
    createdAt: now,
    updatedAt: now,
    ...ticketData,
  };

  const current = getStoredTickets();
  const updated = [newTicket, ...current];
  saveStoredTickets(updated);

  try {
    await fetch('/api/customer-service/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    });
  } catch {
    // Local persistence worked
  }

  return newTicket;
}
