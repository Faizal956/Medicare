import { supabase } from './supabase';
import type { MedicineAnalysis } from '../types';

// =============================================
// PROFILES
// =============================================

export interface DbProfile {
  id: string;
  user_id: string;
  name: string;
  color: string;
  preferred_language_code: string;
  preferred_voice_id: string;
  created_at: string;
}

export async function getProfiles(userId: string): Promise<DbProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveProfile(userId: string, profile: {
  name: string;
  color: string;
  preferredLanguageCode: string;
  preferredVoiceId: string;
}): Promise<DbProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      name: profile.name,
      color: profile.color,
      preferred_language_code: profile.preferredLanguageCode,
      preferred_voice_id: profile.preferredVoiceId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(profileId: string, updates: {
  preferred_language_code?: string;
  preferred_voice_id?: string;
}) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId);
  if (error) throw error;
}

export async function deleteProfile(profileId: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', profileId);
  if (error) throw error;
}

// =============================================
// MEDICATIONS
// =============================================

export interface DbMedication {
  id: string;
  profile_id: string;
  name: string;
  added_at: string;
}

export async function getMedications(profileId: string): Promise<DbMedication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('profile_id', profileId)
    .order('added_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMedication(profileId: string, name: string): Promise<DbMedication> {
  const { data, error } = await supabase
    .from('medications')
    .insert({ profile_id: profileId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeMedication(medicationId: string) {
  const { error } = await supabase.from('medications').delete().eq('id', medicationId);
  if (error) throw error;
}

// =============================================
// REMINDERS
// =============================================

export interface DbReminder {
  id: string;
  profile_id: string;
  medicine_name: string;
  dosage: string | null;
  time: string;
  active: boolean;
}

export async function getReminders(profileId: string): Promise<DbReminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('profile_id', profileId)
    .order('time', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addReminder(profileId: string, reminder: {
  medicineName: string;
  dosage: string;
  time: string;
}): Promise<DbReminder> {
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      profile_id: profileId,
      medicine_name: reminder.medicineName,
      dosage: reminder.dosage,
      time: reminder.time,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReminder(reminderId: string) {
  const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
  if (error) throw error;
}

// =============================================
// SCAN HISTORY
// =============================================

export interface DbScanEntry {
  id: string;
  user_id: string;
  profile_id: string | null;
  profile_name: string | null;
  medicine_name: string;
  analysis: MedicineAnalysis;
  image_path: string | null;
  scanned_at: string;
}

export async function saveScanEntry(entry: {
  userId: string;
  profileId: string;
  profileName: string;
  medicineName: string;
  analysis: MedicineAnalysis;
  imagePath?: string;
}): Promise<DbScanEntry> {
  const { data, error } = await supabase
    .from('scan_history')
    .insert({
      user_id: entry.userId,
      profile_id: entry.profileId,
      profile_name: entry.profileName,
      medicine_name: entry.medicineName,
      analysis: entry.analysis,
      image_path: entry.imagePath || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getScanHistory(userId: string): Promise<DbScanEntry[]> {
  const { data, error } = await supabase
    .from('scan_history')
    .select('*')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// =============================================
// IMAGE STORAGE
// =============================================

export async function uploadMedicineImage(
  userId: string,
  base64Data: string,
  fileName?: string
): Promise<string> {
  const name = fileName || `scan_${Date.now()}.jpg`;
  const filePath = `${userId}/${name}`;
  
  // Convert base64 to Blob
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });

  const { error } = await supabase.storage
    .from('medicine-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  if (error) throw error;

  return filePath;
}

export function getMedicineImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('medicine-images')
    .getPublicUrl(filePath);
  return data.publicUrl;
}
