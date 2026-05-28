import { supabase, isSupabaseConfigured } from './supabase';
import { RSVP } from './types';

const LOCAL_STORAGE_KEY = 'rsvp_local_fallback';

function getLocalRSVPs(): RSVP[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalRSVPs(list: RSVP[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to write local backup:', e);
  }
}

// Fetch all RSVPs asynchronously from Supabase (with fallback)
export async function getRSVPs(): Promise<RSVP[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured yet. Falling back to Local Storage.');
    return getLocalRSVPs();
  }

  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return (data || []) as RSVP[];
  } catch (error) {
    console.error('Error fetching RSVPs from Supabase:', error);
    return getLocalRSVPs();
  }
}

// Submit a new RSVP dynamically to Supabase
export async function addRSVP(rsvp: Omit<RSVP, 'id' | 'createdAt' | 'invitationType'>): Promise<RSVP> {
  const id = `rsvp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const newRsvp: RSVP = {
    ...rsvp,
    id,
    createdAt: new Date().toISOString(),
    invitationType: 'pending' // Default to pending until administrative override
  };

  // Perform local backup update first
  const localList = getLocalRSVPs();
  localList.unshift(newRsvp);
  saveLocalRSVPs(localList);

  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured yet. Saved to fallback Local Storage.');
    return newRsvp;
  }

  try {
    const { error } = await supabase
      .from('rsvps')
      .insert([newRsvp]);

    if (error) throw error;
    return newRsvp;
  } catch (error) {
    console.error('Error adding RSVP to Supabase:', error);
    return newRsvp;
  }
}

// Update an RSVP's ticket designation dynamically in Supabase
export async function updateInvitationType(id: string, type: 'weekend' | 'day'): Promise<void> {
  // Update local fallback
  const localList = getLocalRSVPs();
  const index = localList.findIndex(r => r.id === id);
  if (index !== -1) {
    localList[index].invitationType = type;
    saveLocalRSVPs(localList);
  }

  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured yet. Updated in fallback Local Storage.');
    return;
  }

  try {
    const { error } = await supabase
      .from('rsvps')
      .update({ invitationType: type })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating RSVP in Supabase:', error);
    throw error;
  }
}

// Remove an RSVP entry from Supabase
export async function deleteRSVP(id: string): Promise<void> {
  // Update local fallback
  const localList = getLocalRSVPs();
  const filtered = localList.filter(r => r.id !== id);
  saveLocalRSVPs(filtered);

  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured yet. Removed from fallback Local Storage.');
    return;
  }

  try {
    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting RSVP from Supabase:', error);
    throw error;
  }
}

// Calculate countdown days
export function getDaysLeft(): number {
  const eventDate = new Date('2026-08-08T00:00:00');
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
