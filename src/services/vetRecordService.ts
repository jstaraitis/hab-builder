import { supabase } from '../lib/supabase';

/**
 * Vet Record Types
 */
export interface VetRecord {
  id: string;
  enclosureAnimalId: string;
  userId: string;
  visitDate: string;
  visitType: 'checkup' | 'illness' | 'injury' | 'surgery' | 'emergency' | 'follow-up' | 'other';
  vetName?: string;
  clinicName?: string;
  clinicPhone?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string[];
  cost?: number;
  currency: string;
  followUpNeeded: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  notes?: string;
  documents?: string[];
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VetRecordInput {
  enclosureAnimalId: string;
  visitDate: string;
  visitType: 'checkup' | 'illness' | 'injury' | 'surgery' | 'emergency' | 'follow-up' | 'other';
  vetName?: string;
  clinicName?: string;
  clinicPhone?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string[];
  cost?: number;
  currency?: string;
  followUpNeeded?: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  notes?: string;
  documents?: string[];
  photos?: string[];
}

export interface VetCostSummary {
  totalCost: number;
  currency: string;
  visitCount: number;
  averageCostPerVisit: number;
}

/**
 * Vet Record Service
 * 
 * Handles veterinary visit records and health tracking
 */
class VetRecordService {
  
  /**
   * Get all vet records for a specific animal
   */
  async getRecordsForAnimal(enclosureAnimalId: string): Promise<VetRecord[]> {
    const { data, error } = await supabase
      .from('vet_records')
      .select('*')
      .eq('enclosure_animal_id', enclosureAnimalId)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('Error fetching vet records:', error);
      throw new Error('Failed to fetch vet records');
    }

    return this.mapToVetRecords(data || []);
  }

  /**
   * Get all vet records for a user
   */
  async getRecordsByUser(userId: string): Promise<VetRecord[]> {
    const { data, error } = await supabase
      .from('vet_records')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching user vet records:', error);
      throw new Error('Failed to fetch vet records');
    }

    return this.mapToVetRecords(data || []);
  }

  /**
   * Get upcoming follow-ups for a user (across all animals)
   */
  async getUpcomingFollowUps(userId: string): Promise<VetRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('vet_records')
      .select('*')
      .eq('user_id', userId)
      .eq('follow_up_needed', true)
      .gte('follow_up_date', today)
      .order('follow_up_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming follow-ups:', error);
      throw new Error('Failed to fetch upcoming follow-ups');
    }

    return this.mapToVetRecords(data || []);
  }

  /**
   * Get a single vet record by ID
   */
  async getRecordById(id: string): Promise<VetRecord | null> {
    const { data, error } = await supabase
      .from('vet_records')
      .select('*')
      .eq('id', id)
      .limit(1);

    if (error) {
      console.error('Error fetching vet record:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapToVetRecord(data[0]);
  }

  /**
   * Create a new vet record
   */
  async createRecord(userId: string, input: VetRecordInput): Promise<VetRecord> {
    const { data, error } = await supabase
      .from('vet_records')
      .insert({
        user_id: userId,
        enclosure_animal_id: input.enclosureAnimalId,
        visit_date: input.visitDate,
        visit_type: input.visitType,
        vet_name: input.vetName,
        clinic_name: input.clinicName,
        clinic_phone: input.clinicPhone,
        chief_complaint: input.chiefComplaint,
        diagnosis: input.diagnosis,
        treatment: input.treatment,
        prescriptions: input.prescriptions,
        cost: input.cost,
        currency: input.currency || 'USD',
        follow_up_needed: input.followUpNeeded ?? false,
        follow_up_date: input.followUpDate,
        follow_up_notes: input.followUpNotes,
        notes: input.notes,
        documents: input.documents,
        photos: input.photos,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vet record:', error);
      throw new Error('Failed to create vet record');
    }

    return this.mapToVetRecord(data);
  }

  /**
   * Update an existing vet record
   */
  async updateRecord(id: string, updates: Partial<VetRecordInput>): Promise<VetRecord> {
    const updateData: any = {};
    
    if (updates.visitDate !== undefined) updateData.visit_date = updates.visitDate;
    if (updates.visitType !== undefined) updateData.visit_type = updates.visitType;
    if (updates.vetName !== undefined) updateData.vet_name = updates.vetName;
    if (updates.clinicName !== undefined) updateData.clinic_name = updates.clinicName;
    if (updates.clinicPhone !== undefined) updateData.clinic_phone = updates.clinicPhone;
    if (updates.chiefComplaint !== undefined) updateData.chief_complaint = updates.chiefComplaint;
    if (updates.diagnosis !== undefined) updateData.diagnosis = updates.diagnosis;
    if (updates.treatment !== undefined) updateData.treatment = updates.treatment;
    if (updates.prescriptions !== undefined) updateData.prescriptions = updates.prescriptions;
    if (updates.cost !== undefined) updateData.cost = updates.cost;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.followUpNeeded !== undefined) updateData.follow_up_needed = updates.followUpNeeded;
    if (updates.followUpDate !== undefined) updateData.follow_up_date = updates.followUpDate;
    if (updates.followUpNotes !== undefined) updateData.follow_up_notes = updates.followUpNotes;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.documents !== undefined) updateData.documents = updates.documents;
    if (updates.photos !== undefined) updateData.photos = updates.photos;

    const { data, error } = await supabase
      .from('vet_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vet record:', error);
      throw new Error('Failed to update vet record');
    }

    return this.mapToVetRecord(data);
  }

  /**
   * Delete a vet record
   */
  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('vet_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vet record:', error);
      throw new Error('Failed to delete vet record');
    }
  }

  /**
   * Get total vet costs for an animal
   */
  async getTotalVetCosts(enclosureAnimalId: string): Promise<VetCostSummary> {
    const records = await this.getRecordsForAnimal(enclosureAnimalId);
    
    const recordsWithCost = records.filter(r => r.cost && r.cost > 0);
    
    if (recordsWithCost.length === 0) {
      return {
        totalCost: 0,
        currency: 'USD',
        visitCount: 0,
        averageCostPerVisit: 0,
      };
    }

    const totalCost = recordsWithCost.reduce((sum, r) => sum + (r.cost || 0), 0);
    const currency = recordsWithCost[0].currency;

    return {
      totalCost,
      currency,
      visitCount: recordsWithCost.length,
      averageCostPerVisit: Math.round(totalCost / recordsWithCost.length * 100) / 100,
    };
  }

  /**
   * Map database row to VetRecord
   */
  private mapToVetRecord(data: any): VetRecord {
    return {
      id: data.id,
      enclosureAnimalId: data.enclosure_animal_id,
      userId: data.user_id,
      visitDate: data.visit_date,
      visitType: data.visit_type,
      vetName: data.vet_name,
      clinicName: data.clinic_name,
      clinicPhone: data.clinic_phone,
      chiefComplaint: data.chief_complaint,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      prescriptions: data.prescriptions,
      cost: data.cost,
      currency: data.currency,
      followUpNeeded: data.follow_up_needed,
      followUpDate: data.follow_up_date,
      followUpNotes: data.follow_up_notes,
      notes: data.notes,
      documents: data.documents,
      photos: data.photos,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map array of database rows to VetRecords
   */
  private mapToVetRecords(data: any[]): VetRecord[] {
    return data.map(row => this.mapToVetRecord(row));
  }
}

export const vetRecordService = new VetRecordService();
