import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import type { Enclosure } from '../../types/careCalendar';

interface EnclosureManagerProps {
  onEnclosuresChanged?: () => void;
}

export function EnclosureManager({ onEnclosuresChanged }: EnclosureManagerProps) {
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
    if (!confirm(`Delete "${name}"? All associated care tasks will also be permanently deleted.`)) {
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
    return <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          My Enclosures
        </h3>
        <button
          onClick={() => navigate(`/care-calendar/enclosures/add?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
          title="Add Enclosure"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Enclosures List */}
      {enclosures.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No enclosures yet. Add one to organize your care tasks!
        </div>
      ) : (
        <div className="space-y-3">
          {enclosures.map(enclosure => (
            <div
              key={enclosure.id}
              className="space-y-2"
            >
              {/* Enclosure Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {enclosure.name}
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {enclosure.animalName}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {enclosure.substrateType && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded capitalize">
                          {enclosure.substrateType}
                        </span>
                      )}
                    </div>
                    {enclosure.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {enclosure.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/care-calendar/enclosures/edit/${enclosure.id}?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
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
              </div>

              {/* Manage Animals Button - Outside Card */}
              <button
                onClick={() => navigate('/my-animals')}
                className="w-full px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Manage Animals
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
