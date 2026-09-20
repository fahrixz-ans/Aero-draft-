import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DonationConfigData } from '../types/donation';

export const DEFAULT_DONATION_CONFIG: DonationConfigData = {
  enabled: true,
  minAmount: 5000,
  description: 'Terima kasih telah mendukung perkembangan Mod Station. Pilih metode donasi yang tersedia di bawah ini.',
  qris: {
    merchantName: 'Fantra Store',
    nmid: 'ID1026477572014-A01',
    city: 'KOTA BANDAR LAMPUNG',
    imageUrl: '/mod-station-qris.png'
  },
  banks: [
    {
      id: 'seabank',
      bankName: 'SeaBank',
      accountHolder: 'FAHRI ANDRIAN SAPUTRA',
      accountNumber: '901160911399'
    },
    {
      id: 'jago',
      bankName: 'Bank Jago',
      accountHolder: 'FAHRI ANDRIAN SAPUTRA',
      accountNumber: '102667101926'
    }
  ]
};

export async function fetchDonationConfig(): Promise<DonationConfigData> {
  try {
    const docRef = doc(db, 'configs', 'donation');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        enabled: data.enabled ?? DEFAULT_DONATION_CONFIG.enabled,
        minAmount: data.minAmount ?? DEFAULT_DONATION_CONFIG.minAmount,
        description: data.description || DEFAULT_DONATION_CONFIG.description,
        qris: data.qris ? {
          merchantName: data.qris.merchantName || DEFAULT_DONATION_CONFIG.qris!.merchantName,
          nmid: data.qris.nmid || DEFAULT_DONATION_CONFIG.qris!.nmid,
          city: data.qris.city || DEFAULT_DONATION_CONFIG.qris!.city,
          imageUrl: data.qris.imageUrl || DEFAULT_DONATION_CONFIG.qris!.imageUrl
        } : DEFAULT_DONATION_CONFIG.qris,
        banks: data.banks && Array.isArray(data.banks) && data.banks.length > 0
          ? data.banks
          : DEFAULT_DONATION_CONFIG.banks
      };
    }
  } catch (err) {
    console.warn('Error fetching donation config from Firestore:', err);
  }

  return DEFAULT_DONATION_CONFIG;
}

export async function saveDonationConfig(config: DonationConfigData): Promise<boolean> {
  try {
    const docRef = doc(db, 'configs', 'donation');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving donation config to Firestore:', err);
    throw err;
  }
}

