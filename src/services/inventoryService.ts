import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types/inventory';

/**
 * Inventory Item Service
 *
 * Database Schema Required:
 *
 * CREATE TABLE inventory_items (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES auth.users(id),
 *   enclosure_id TEXT,
 *   animal_id TEXT,
 *   title TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   brand TEXT,
 *   notes TEXT,
 *   reminder_frequency TEXT NOT NULL,
 *   custom_frequency_days INTEGER,
 *   reminder_time TEXT,
 *   next_due_at TIMESTAMPTZ NOT NULL,
 *   last_replaced_at TIMESTAMPTZ,
 *   buy_again_url TEXT,
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_inventory_items_user_id ON inventory_items(user_id);
 * CREATE INDEX idx_inventory_items_next_due ON inventory_items(next_due_at);
 */
export interface IInventoryService {
  getItems(userId?: string): Promise<InventoryItem[]>;
  getItemById(id: string): Promise<InventoryItem | null>;
  createItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem>;
  updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteItem(id: string): Promise<void>;
  markReplaced(id: string, replacedAt?: Date): Promise<InventoryItem>;
}

export class SupabaseInventoryService implements IInventoryService {
  async getItems(userId?: string): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('next_due_at', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapItemFromDb);
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapItemFromDb(data);
  }

  async createItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    const now = new Date();
    const dbItem = this.mapItemToDb({
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([dbItem])
      .select()
      .single();

    if (error) throw error;

    return this.mapItemFromDb(data);
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const dbUpdates = {
      ...this.mapItemToDb(updates as InventoryItem),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('inventory_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapItemFromDb(data);
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async markReplaced(id: string, replacedAt: Date = new Date()): Promise<InventoryItem> {
    const item = await this.getItemById(id);
    if (!item) throw new Error('Item not found');

    const nextDueAt = this.calculateNextDueDate(item, replacedAt);

    return this.updateItem(id, {
      lastReplacedAt: replacedAt,
      nextDueAt,
    });
  }

  private calculateNextDueDate(item: InventoryItem, from: Date): Date {
    const next = new Date(from);

    switch (item.reminderFrequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'every-other-day':
        next.setDate(next.getDate() + 2);
        break;
      case 'twice-weekly':
        next.setDate(next.getDate() + 3);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'custom':
        next.setDate(next.getDate() + (item.customFrequencyDays || 1));
        break;
    }

    if (item.reminderTime) {
      const [hours, minutes] = item.reminderTime.split(':').map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    return next;
  }

  private mapItemFromDb(row: any): InventoryItem {
    return {
      id: row.id,
      userId: row.user_id,
      enclosureId: row.enclosure_id,
      animalId: row.animal_id,
      title: row.title,
      category: row.category,
      brand: row.brand ?? undefined,
      notes: row.notes ?? undefined,
      reminderFrequency: row.reminder_frequency,
      customFrequencyDays: row.custom_frequency_days ?? undefined,
      reminderTime: row.reminder_time ?? undefined,
      nextDueAt: new Date(row.next_due_at),
      lastReplacedAt: row.last_replaced_at ? new Date(row.last_replaced_at) : undefined,
      buyAgainUrl: row.buy_again_url ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapItemToDb(item: InventoryItem): any {
    return {
      id: item.id,
      user_id: item.userId,
      enclosure_id: item.enclosureId,
      animal_id: item.animalId,
      title: item.title,
      category: item.category,
      brand: item.brand,
      notes: item.notes,
      reminder_frequency: item.reminderFrequency,
      custom_frequency_days: item.customFrequencyDays,
      reminder_time: item.reminderTime,
      next_due_at: item.nextDueAt instanceof Date ? item.nextDueAt.toISOString() : item.nextDueAt,
      last_replaced_at: item.lastReplacedAt instanceof Date ? item.lastReplacedAt.toISOString() : item.lastReplacedAt,
      buy_again_url: item.buyAgainUrl,
      is_active: item.isActive,
      created_at: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updated_at: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  }
}

export const inventoryService = new SupabaseInventoryService();
