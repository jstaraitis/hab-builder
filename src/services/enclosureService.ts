import { supabase } from '../lib/supabase';
import type { Enclosure } from '../types/careCalendar';

export interface IEnclosureService {
  getEnclosures(userId?: string): Promise<Enclosure[]>;
  getEnclosureById(id: string): Promise<Enclosure | null>;
  createEnclosure(enclosure: Omit<Enclosure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Enclosure>;
  updateEnclosure(id: string, updates: Partial<Enclosure>): Promise<Enclosure>;
  deleteEnclosure(id: string): Promise<void>;
}

class SupabaseEnclosureService implements IEnclosureService {
  async getEnclosures(userId?: string): Promise<Enclosure[]> {
    let query = supabase
      .from('enclosures')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return this.mapEnclosuresFromDb(data || []);
  }

  async getEnclosureById(id: string): Promise<Enclosure | null> {
    const { data, error } = await supabase
      .from('enclosures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapEnclosureFromDb(data);
  }

  async createEnclosure(enclosureData: Omit<Enclosure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Enclosure> {
    const dbEnclosure = this.mapEnclosureToDb(enclosureData as Enclosure);

    const { data, error } = await supabase
      .from('enclosures')
      .insert([dbEnclosure])
      .select()
      .single();

    if (error) throw error;

    return this.mapEnclosureFromDb(data);
  }

  async updateEnclosure(id: string, updates: Partial<Enclosure>): Promise<Enclosure> {
    const dbUpdates = {
      ...this.mapEnclosureToDb(updates as Enclosure),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('enclosures')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapEnclosureFromDb(data);
  }

  async deleteEnclosure(id: string): Promise<void> {
    // First, delete all tasks associated with this enclosure
    const { error: tasksError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('enclosure_id', id);

    if (tasksError) throw tasksError;

    // Then delete the enclosure itself
    const { error } = await supabase
      .from('enclosures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Database mapping helpers
  private mapEnclosureFromDb(row: any): Enclosure {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      animalId: row.animal_id,
      animalName: row.animal_name,
      description: row.description,
      setupDate: row.setup_date ? new Date(row.setup_date) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapEnclosuresFromDb(rows: any[]): Enclosure[] {
    return rows.map(row => this.mapEnclosureFromDb(row));
  }

  private mapEnclosureToDb(enclosure: Partial<Enclosure>): any {
    const mapped: any = {};
    
    if (enclosure.id !== undefined) mapped.id = enclosure.id;
    if (enclosure.userId !== undefined) mapped.user_id = enclosure.userId;
    if (enclosure.name !== undefined) mapped.name = enclosure.name;
    if (enclosure.animalId !== undefined) mapped.animal_id = enclosure.animalId;
    if (enclosure.animalName !== undefined) mapped.animal_name = enclosure.animalName;
    if (enclosure.description !== undefined) mapped.description = enclosure.description;
    if (enclosure.setupDate !== undefined) mapped.setup_date = enclosure.setupDate?.toISOString().split('T')[0];
    if (enclosure.isActive !== undefined) mapped.is_active = enclosure.isActive;
    if (enclosure.createdAt !== undefined) mapped.created_at = enclosure.createdAt.toISOString();
    if (enclosure.updatedAt !== undefined) mapped.updated_at = enclosure.updatedAt.toISOString();

    return mapped;
  }
}

export const enclosureService = new SupabaseEnclosureService();
