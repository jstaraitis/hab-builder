import { supabase } from '../lib/supabase';
import type { EnclosureEvent, EnclosureEventSeverity, EnclosureEventType } from '../types/careCalendar';

export interface EnclosureEventInput {
  enclosureId: string;
  eventDate?: Date;
  eventType: EnclosureEventType;
  severity?: EnclosureEventSeverity;
  quantityValue?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  photoUrls?: string[];
}

class EnclosureEventService {
  async getRecentEventsForEnclosure(enclosureId: string, limit: number = 25): Promise<EnclosureEvent[]> {
    const { data, error } = await supabase
      .from('enclosure_events')
      .select('*')
      .eq('enclosure_id', enclosureId)
      .order('event_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row) => this.mapFromDb(row));
  }

  async createEvent(userId: string, input: EnclosureEventInput): Promise<EnclosureEvent> {
    const { data, error } = await supabase
      .from('enclosure_events')
      .insert({
        user_id: userId,
        enclosure_id: input.enclosureId,
        event_date: input.eventDate ? input.eventDate.toISOString() : new Date().toISOString(),
        event_type: input.eventType,
        severity: input.severity,
        quantity_value: input.quantityValue,
        notes: input.notes,
        metadata: input.metadata,
        photo_urls: input.photoUrls,
      })
      .select('*')
      .single();

    if (error) throw error;

    return this.mapFromDb(data);
  }

  async updateEvent(id: string, updates: Partial<EnclosureEventInput>): Promise<EnclosureEvent> {
    const payload: Record<string, unknown> = {};

    if (updates.enclosureId !== undefined) payload.enclosure_id = updates.enclosureId;
    if (updates.eventDate !== undefined) payload.event_date = updates.eventDate.toISOString();
    if (updates.eventType !== undefined) payload.event_type = updates.eventType;
    if (updates.severity !== undefined) payload.severity = updates.severity;
    if (updates.quantityValue !== undefined) payload.quantity_value = updates.quantityValue;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.metadata !== undefined) payload.metadata = updates.metadata;
    if (updates.photoUrls !== undefined) payload.photo_urls = updates.photoUrls;

    const { data, error } = await supabase
      .from('enclosure_events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return this.mapFromDb(data);
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('enclosure_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private mapFromDb(row: any): EnclosureEvent {
    return {
      id: row.id,
      enclosureId: row.enclosure_id,
      userId: row.user_id,
      eventDate: new Date(row.event_date),
      eventType: row.event_type,
      severity: row.severity ?? undefined,
      quantityValue: row.quantity_value == null ? undefined : Number(row.quantity_value),
      notes: row.notes ?? undefined,
      metadata: row.metadata ?? undefined,
      photoUrls: row.photo_urls ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const enclosureEventService = new EnclosureEventService();
