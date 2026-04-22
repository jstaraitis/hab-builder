import { useState, useEffect } from 'react';
import { Home, Plus, Pencil, Trash2, Thermometer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import type { Enclosure } from '../../types/careCalendar';

interface EnclosureManagerProps {
  readonly onEnclosuresChanged?: () => void;
  readonly isPremium?: boolean;
}

export function EnclosureManager({ onEnclosuresChanged, isPremium }: Readonly<EnclosureManagerProps>) {
  const { user } = useAuth();
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadEnclosures();
    }
  }, [user, location.key]);

  const loadEnclosures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enclosureService.getEnclosures();
      setEnclosures(data);
    } catch (err) {
      console.error('Failed to load enclosures:', err);
      setError('Failed to load enclosures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes the enclosure and cannot be undone.`)) {
      return;
    }

    try {
      await enclosureService.deleteEnclosure(id);
      await loadEnclosures();
      onEnclosuresChanged?.();
    } catch (err) {
      console.error('Failed to delete enclosure:', err);
      setError('Failed to delete enclosure');
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">
          My Enclosures
        </h3>
        <button
          onClick={() => navigate(`/care-calendar/enclosures/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
          className="p-2 bg-accent text-white rounded-lg hover:bg-accent-dim dark:bg-accent dark:hover:bg-accent-dim transition-colors"
          title={!isPremium && enclosures.length >= 1 ? 'Upgrade to add more enclosures' : 'Add Enclosure'}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Enclosures List */}
      {enclosures.length === 0 ? (
        <div className="text-center py-8 text-muted text-sm">
          No enclosures yet. Add one to organize your care tasks!
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enclosures.map(enclosure => (
            <div key={enclosure.id} className="space-y-2">
              <div className="bg-card border border-divider rounded-lg p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="h-20 w-20 rounded-lg border border-divider bg-gray-100 bg-card overflow-hidden flex items-center justify-center text-gray-400 flex-shrink-0">
                    {enclosure.photoUrl ? (
                      <img
                        src={enclosure.photoUrl}
                        alt={enclosure.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <Home className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {enclosure.name}
                        </h4>
                        <p className="text-xs text-accent truncate">
                          {enclosure.animalName}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => navigate(`/care-calendar/enclosures/edit/${enclosure.id}?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                          className="p-1.5 text-gray-600 hover:text-gray-900 text-muted dark:hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(enclosure.id, enclosure.name)}
                          className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {enclosure.substrateType && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded capitalize">
                          {enclosure.substrateType}
                        </span>
                      )}
                    </div>
                    {enclosure.description && (
                      <p className="text-xs text-muted mt-2 line-clamp-2">
                        {enclosure.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/care-calendar/enclosures/${enclosure.id}/environment`)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-divider px-2 py-1 text-xs font-semibold text-accent hover:text-accent-dim transition-colors"
                        title="Open environment controls"
                      >
                        <Thermometer className="w-3.5 h-3.5" />
                        Environment
                      </button>
                      <button
                        onClick={() => navigate(`/care-calendar/enclosures/edit/${enclosure.id}?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-divider px-2 py-1 text-xs font-semibold text-muted hover:text-white transition-colors"
                        title="Edit enclosure"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(enclosure.id, enclosure.name)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                        title="Delete enclosure"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

