import { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import type { InventoryCategory, InventoryFrequency} from '../../types/inventory';
import {
  CATEGORY_OPTIONS,
  FREQUENCY_OPTIONS,
  EMPTY_INVENTORY_FORM,
  POWERED_CATEGORIES,
  parseInventoryCosts,
  type InventoryFormState,
} from '../../utils/inventoryUtils';
import { DEFAULT_DUTY_CYCLE, monthlyKwh } from '../../engine/costOfKeeping';

const FIELD_CLASS =
  'w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent';

const LABEL_CLASS = 'block text-xs font-semibold text-muted uppercase tracking-wide mb-2';

interface InventoryItemFormProps {
  readonly mode: 'add' | 'edit';
  readonly initialData?: InventoryFormState;
  readonly onSave: (form: InventoryFormState) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDelete?: () => Promise<void>;
}

export function InventoryItemForm({ mode, initialData, onSave, onCancel, onDelete }: InventoryItemFormProps) {
  const [form, setForm] = useState<InventoryFormState>(initialData ?? EMPTY_INVENTORY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Opened by hand for the things that draw power but do not look like it —
  // foggers, pumps and thermostats all end up filed under "other".
  // Any stored power value opens the panel, not just the wattage — otherwise a
  // half-filled record would be invisible and unfixable in the form.
  const [powerOpenedByHand, setPowerOpenedByHand] = useState(() =>
    Boolean(
      initialData?.watts?.trim() ||
        initialData?.hoursPerDay?.trim() ||
        initialData?.dutyCyclePercent?.trim()
    )
  );

  const showPower = powerOpenedByHand || POWERED_CATEGORIES.has(form.category);

  /**
   * Shown live while typing. It needs no tariff, so it works before the keeper
   * has entered an electricity rate — and it catches the digit-slip that turns
   * a 50W bulb into 500W far better than a number sitting in a database does.
   */
  const powerPreview = useMemo(() => {
    const watts = Number(form.watts.trim());
    const hours = Number(form.hoursPerDay.trim());
    if (!form.watts.trim() || !Number.isFinite(watts) || watts <= 0) return null;
    if (!form.hoursPerDay.trim() || !Number.isFinite(hours) || hours <= 0) return null;

    const percent = Number(form.dutyCyclePercent.trim());
    const hasDuty =
      Boolean(form.dutyCyclePercent.trim()) &&
      Number.isFinite(percent) &&
      percent > 0 &&
      percent <= 100;

    return {
      kwh: monthlyKwh({
        label: form.title,
        watts,
        hoursPerDay: hours,
        dutyCycle: hasDuty ? percent / 100 : undefined,
      }),
      assumedDuty: !hasDuty,
    };
  }, [form.watts, form.hoursPerDay, form.dutyCyclePercent, form.title]);

  /** A wattage with no runtime cannot be costed, so it is silently ignored. */
  const wattsWithoutHours =
    Boolean(form.watts.trim()) && !form.hoursPerDay.trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter an item name.');
      return;
    }

    // Checked here rather than only at the database, which would come back as
    // a constraint violation no keeper can act on.
    const costs = parseInventoryCosts(form);
    if (costs.error) {
      setError(costs.error);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(form);
    } catch (err) {
      console.error('❌ Failed to save inventory item:', err);
      setError('Failed to save inventory item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    // Deleting the record is permanent — the row is removed, not archived.
    if (!confirm(`Delete "${form.title || 'this item'}"? This permanently removes the item and its reminder.`)) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await onDelete();
    } catch (err) {
      console.error('❌ Failed to delete inventory item:', err);
      setError('Failed to delete inventory item.');
      setDeleting(false);
    }
    // On success the view navigates away, so `deleting` stays true to keep
    // the button disabled through the transition.
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center justify-between border-b border-divider">
        <h1 className="text-lg font-bold text-white">
          {mode === 'add' ? 'Add Inventory Reminder' : 'Edit Inventory Reminder'}
        </h1>
        <button onClick={onCancel} className="text-sm font-semibold text-accent">Back</button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="space-y-3 px-4 py-4">
          <div className="bg-card border border-divider rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="inventory-title" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Item name <span className="text-red-400">*</span></label>
                  <input
                    id="inventory-title"
                    value={form.title}
                    onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Arcadia T5 UVB bulb"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-category" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Category <span className="text-red-400">*</span></label>
                  <select
                    id="inventory-category"
                    value={form.category}
                    onChange={(event) => setForm(prev => ({ ...prev, category: event.target.value as InventoryCategory }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inventory-brand" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Brand</label>
                  <input
                    id="inventory-brand"
                    value={form.brand}
                    onChange={(event) => setForm(prev => ({ ...prev, brand: event.target.value }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Arcadia"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-last-replaced" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Last replaced</label>
                  <input
                    id="inventory-last-replaced"
                    type="date"
                    value={form.lastReplacedAt}
                    onChange={(event) => setForm(prev => ({ ...prev, lastReplacedAt: event.target.value }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-frequency" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Reminder frequency <span className="text-red-400">*</span></label>
                  <select
                    id="inventory-frequency"
                    value={form.reminderFrequency}
                    onChange={(event) => setForm(prev => ({ ...prev, reminderFrequency: event.target.value as InventoryFrequency }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    {FREQUENCY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                {form.reminderFrequency === 'custom' && (
                  <div>
                    <label htmlFor="inventory-custom-days" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Every (days) <span className="text-red-400">*</span></label>
                    <input
                      id="inventory-custom-days"
                      type="number"
                      min={1}
                      value={form.customFrequencyDays}
                      onChange={(event) => setForm(prev => ({ ...prev, customFrequencyDays: event.target.value }))}
                      className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="inventory-reminder-time" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Reminder time</label>
                  <input
                    id="inventory-reminder-time"
                    type="time"
                    value={form.reminderTime}
                    onChange={(event) => setForm(prev => ({ ...prev, reminderTime: event.target.value }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="inventory-amazon-link" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Amazon link</label>
                  <input
                    id="inventory-amazon-link"
                    value={form.buyAgainUrl}
                    onChange={(event) => setForm(prev => ({ ...prev, buyAgainUrl: event.target.value }))}
                    className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="https://www.amazon.com/dp/..."
                  />
                </div>
              </div>

              {/* Cost and power.
                  Optional, and deliberately last. These feed the
                  cost-of-keeping breakdown, which is not worth making the act
                  of adding a reminder feel like bookkeeping. */}
              <div className="rounded-xl border border-divider p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Cost &amp; power</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Optional. Feeds your cost of keeping — anything left blank is reported as
                    unrecorded rather than counted as nothing.
                  </p>
                </div>

                <div>
                  <label htmlFor="inventory-unit-cost" className={LABEL_CLASS}>Cost per item</label>
                  <input
                    id="inventory-unit-cost"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={form.unitCost}
                    onChange={(event) => setForm(prev => ({ ...prev, unitCost: event.target.value }))}
                    className={FIELD_CLASS}
                    placeholder="24.99"
                  />
                  <p className="text-xs text-muted mt-1.5">
                    Charged once every time this reminder comes round, so the frequency above is
                    what turns it into a monthly figure.
                  </p>
                </div>

                {!showPower && (
                  <button
                    type="button"
                    onClick={() => setPowerOpenedByHand(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    This draws power
                  </button>
                )}

                {showPower && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="inventory-watts" className={LABEL_CLASS}>Watts</label>
                        <input
                          id="inventory-watts"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={5000}
                          value={form.watts}
                          onChange={(event) => setForm(prev => ({ ...prev, watts: event.target.value }))}
                          className={FIELD_CLASS}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label htmlFor="inventory-hours" className={LABEL_CLASS}>Hours / day</label>
                        <input
                          id="inventory-hours"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={24}
                          step="0.5"
                          value={form.hoursPerDay}
                          onChange={(event) => setForm(prev => ({ ...prev, hoursPerDay: event.target.value }))}
                          className={FIELD_CLASS}
                          placeholder="12"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="inventory-duty-cycle" className={LABEL_CLASS}>
                        On a thermostat? (%)
                      </label>
                      <input
                        id="inventory-duty-cycle"
                        type="number"
                        inputMode="decimal"
                        min={1}
                        max={100}
                        value={form.dutyCyclePercent}
                        onChange={(event) => setForm(prev => ({ ...prev, dutyCyclePercent: event.target.value }))}
                        className={FIELD_CLASS}
                        placeholder={String(Math.round(DEFAULT_DUTY_CYCLE * 100))}
                      />
                      <p className="text-xs text-muted mt-1.5">
                        Roughly what share of those hours it is actually drawing power. A stat cuts
                        the lamp off once the basking spot is up to temperature, so a device left at
                        100% reads about twice as expensive as it is. Blank assumes{' '}
                        {Math.round(DEFAULT_DUTY_CYCLE * 100)}%.
                      </p>
                    </div>

                    {wattsWithoutHours && (
                      <p className="text-xs text-amber-300">
                        Add the daily hours too — a wattage on its own cannot be costed, so this
                        item will be left out of your electricity figure.
                      </p>
                    )}

                    {powerPreview && (
                      <p className="text-xs text-muted">
                        About <span className="font-semibold text-white">{powerPreview.kwh.toFixed(1)} kWh</span> a
                        month
                        {powerPreview.assumedDuty
                          ? `, assuming ${Math.round(DEFAULT_DUTY_CYCLE * 100)}% duty cycle.`
                          : '.'}{' '}
                        Multiply by your rate per kWh for the cost.
                      </p>
                    )}

                    {powerOpenedByHand && !POWERED_CATEGORIES.has(form.category) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPowerOpenedByHand(false);
                          setForm(prev => ({ ...prev, watts: '', hoursPerDay: '', dutyCyclePercent: '' }));
                        }}
                        className="text-xs font-semibold text-muted hover:text-white transition-colors"
                      >
                        This does not draw power
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="inventory-notes" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Notes</label>
                <textarea
                  id="inventory-notes"
                  value={form.notes}
                  onChange={(event) => setForm(prev => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-divider bg-card-elevated text-white px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl border border-divider text-white hover:bg-card-elevated transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="px-6 py-2.5 rounded-xl bg-accent text-on-accent font-semibold hover:bg-accent-dim disabled:opacity-60 transition-colors text-sm"
                >
                  {saving ? 'Saving...' : mode === 'add' ? 'Create Reminder' : 'Save Changes'}
                </button>
              </div>

              {/* Delete (edit mode only) */}
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={() => { void handleDelete(); }}
                  disabled={saving || deleting}
                  className="w-full px-3 py-1.5 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-60 font-medium text-xs"
                >
                  {deleting ? 'Deleting...' : 'Delete Item'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
