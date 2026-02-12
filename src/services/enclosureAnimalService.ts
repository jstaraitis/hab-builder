/**
 * Enclosure Animal Service
 * 
 * Manages individual animals within enclosures
 */

import { supabase } from '../lib/supabase';
import { EnclosureAnimal } from '../types/careCalendar';

class EnclosureAnimalService {
  /**
   * Get all animals for a specific enclosure
   */
  async getAnimalsByEnclosure(enclosureId: string): Promise<EnclosureAnimal[]> {
    const { data, error } = await supabase
      .from('enclosure_animals')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching enclosure animals:', error);
      throw error;
    }

    return (data || []).map(this.mapAnimalFromDb);
  }

  /**
   * Get all animals for current user
   */
  async getAllUserAnimals(userId: string): Promise<EnclosureAnimal[]> {
    const { data, error } = await supabase
      .from('enclosure_animals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching user animals:', error);
      throw error;
    }

    return (data || []).map(this.mapAnimalFromDb);
  }

  /**
   * Get a single animal by ID
   */
  async getAnimalById(id: string): Promise<EnclosureAnimal | null> {
    const { data, error } = await supabase
      .from('enclosure_animals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching animal:', error);
      throw error;
    }

    return data ? this.mapAnimalFromDb(data) : null;
  }

  /**
   * Create a new animal
   */
  async createAnimal(animal: Partial<EnclosureAnimal>): Promise<EnclosureAnimal> {
    const mapped = this.mapAnimalToDb(animal);

    const { data, error } = await supabase
      .from('enclosure_animals')
      .insert(mapped)
      .select()
      .single();

    if (error) {
      console.error('Error creating animal:', error);
      throw error;
    }

    return this.mapAnimalFromDb(data);
  }

  /**
   * Update an existing animal
   */
  async updateAnimal(id: string, updates: Partial<EnclosureAnimal>): Promise<EnclosureAnimal> {
    const mapped = this.mapAnimalToDb(updates);

    const { data, error } = await supabase
      .from('enclosure_animals')
      .update(mapped)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating animal:', error);
      throw error;
    }

    return this.mapAnimalFromDb(data);
  }

  /**
   * Delete an animal
   */
  async deleteAnimal(id: string): Promise<void> {
    const { error: taskError } = await supabase
      .from('care_tasks')
      .delete()
      .eq('enclosure_animal_id', id);

    if (taskError) {
      console.error('Error deleting animal care tasks:', taskError);
      throw taskError;
    }

    const { error: weightError } = await supabase
      .from('weight_logs')
      .delete()
      .eq('enclosure_animal_id', id);

    if (weightError) {
      console.error('Error deleting animal weight logs:', weightError);
      throw weightError;
    }

    const { error } = await supabase
      .from('enclosure_animals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting animal:', error);
      throw error;
    }
  }

  /**
   * Get count of animals in an enclosure
   */
  async getAnimalCount(enclosureId: string): Promise<number> {
    const { count, error } = await supabase
      .from('enclosure_animals')
      .select('*', { count: 'exact', head: true })
      .eq('enclosure_id', enclosureId)
      .eq('is_active', true);

    if (error) {
      console.error('Error counting animals:', error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Map database row to EnclosureAnimal interface
   */
  private mapAnimalFromDb(row: any): EnclosureAnimal {
    return {
      id: row.id,
      enclosureId: row.enclosure_id || undefined,
      userId: row.user_id,
      name: row.name,
      animalNumber: row.animal_number,
      gender: row.gender,
      morph: row.morph,
      birthday: row.birthday ? new Date(row.birthday) : undefined,
      notes: row.notes,
      source: row.source,
      sourceDetails: row.source_details,
      acquisitionDate: row.acquisition_date ? new Date(row.acquisition_date) : undefined,
      acquisitionPrice: row.acquisition_price,
      acquisitionNotes: row.acquisition_notes,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Map EnclosureAnimal to database format
   */
  private mapAnimalToDb(animal: Partial<EnclosureAnimal>): any {
    const mapped: any = {};

    if (animal.enclosureId !== undefined) mapped.enclosure_id = animal.enclosureId;
    if (animal.userId !== undefined) mapped.user_id = animal.userId;
    if (animal.name !== undefined) mapped.name = animal.name;
    if (animal.animalNumber !== undefined) mapped.animal_number = animal.animalNumber;
    if (animal.gender !== undefined) mapped.gender = animal.gender;
    if (animal.morph !== undefined) mapped.morph = animal.morph;
    if (animal.birthday !== undefined) {
      mapped.birthday = animal.birthday ? animal.birthday.toISOString().split('T')[0] : null;
    }
    if (animal.notes !== undefined) mapped.notes = animal.notes;
    
    // Acquisition fields
    if (animal.source !== undefined) mapped.source = animal.source;
    if (animal.sourceDetails !== undefined) mapped.source_details = animal.sourceDetails;
    if (animal.acquisitionDate !== undefined) {
      mapped.acquisition_date = animal.acquisitionDate ? animal.acquisitionDate.toISOString().split('T')[0] : null;
    }
    if (animal.acquisitionPrice !== undefined) mapped.acquisition_price = animal.acquisitionPrice;
    if (animal.acquisitionNotes !== undefined) mapped.acquisition_notes = animal.acquisitionNotes;
    
    if (animal.isActive !== undefined) mapped.is_active = animal.isActive;

    return mapped;
  }
}

export const enclosureAnimalService = new EnclosureAnimalService();
