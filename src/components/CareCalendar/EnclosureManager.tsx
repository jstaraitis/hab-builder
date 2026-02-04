import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureService } from '../../services/enclosureService';
import { animalList } from '../../data/animals';
import { AnimalList } from './AnimalList';
import type { Enclosure } from '../../types/careCalendar';

interface EnclosureManagerProps {
  onEnclosuresChanged?: () => void;
}

export function EnclosureManager({ onEnclosuresChanged }: EnclosureManagerProps) {
  const { user } = useAuth();
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEnclosure, setEditingEnclosure] = useState<Enclosure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedEnclosureId, setExpandedEnclosureId] = useState<string | null>(null); // Track expanded enclosure for animals list

  const [formData, setFormData] = useState({
    name: '',
    animalId: '',
    description: '',
    substrateType: '' as '' | 'bioactive' | 'soil' | 'paper' | 'sand' | 'reptile-carpet' | 'tile' | 'other',
  });

  useEffect(() => {
    if (user) {
      loadEnclosures();
    }
  }, [user]);

  const loadEnclosures = async () => {
    try {
      setLoading(true);
      const data = await enclosureService.getEnclosures();
      setEnclosures(data);
    } catch (err) {
      console.error('Failed to load enclosures:', err);
      setError('Failed to load enclosures');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedAnimal = animalList.find(a => a.id === formData.animalId);
    if (!selectedAnimal) return;

    try {
      if (editingEnclosure) {
        await enclosureService.updateEnclosure(editingEnclosure.id, {
          name: formData.name,
          animalId: formData.animalId,
          animalName: selectedAnimal.name,
          description: formData.description,
          substrateType: formData.substrateType || undefined,
        });
      } else {
        await enclosureService.createEnclosure({
          userId: user.id,
          name: formData.name,
          animalId: formData.animalId,
          animalName: selectedAnimal.name,
          description: formData.description,
          substrateType: formData.substrateType || undefined,
          isActive: true,
        });
      }

      await loadEnclosures();
      closeModal();
      onEnclosuresChanged?.();
    } catch (err) {
      console.error('Failed to save enclosure:', err);
      setError('Failed to save enclosure');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Associated tasks will remain but won't show enclosure info.`)) {
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

  const openModal = (enclosure?: Enclosure) => {
    if (enclosure) {
      setEditingEnclosure(enclosure);
      setFormData({
        name: enclosure.name,
        animalId: enclosure.animalId,
        description: enclosure.description || '',
        substrateType: enclosure.substrateType || '',
      });
    } else {
      setEditingEnclosure(null);
      setFormData({ 
        name: '', 
        animalId: '', 
        description: '', 
        substrateType: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEnclosure(null);
    setFormData({ 
      name: '', 
      animalId: '', 
      description: '', 
      substrateType: '',
    });
    setError(null);
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
          onClick={() => openModal()}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Enclosure
        </button>
      </div>

      {/* Enclosures List */}
      {enclosures.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No enclosures yet. Add one to organize your care tasks!
        </div>
      ) : (
        <div className="grid gap-3">
          {enclosures.map(enclosure => (
            <div
              key={enclosure.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Enclosure Header */}
              <div className="p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {enclosure.name}
                  </h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {enclosure.animalName}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {enclosure.substrateType && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded capitalize">
                        {enclosure.substrateType}
                      </span>
                    )}
                  </div>
                  {enclosure.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                      {enclosure.description}
                    </p>
                  )}
                  
                  {/* Animals Toggle Button */}
                  <button
                    onClick={() => setExpandedEnclosureId(expandedEnclosureId === enclosure.id ? null : enclosure.id)}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-md transition-colors"
                  >
                    {expandedEnclosureId === enclosure.id ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Hide Animals
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Manage Animals
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openModal(enclosure)}
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

              {/* AnimalList - Expandable */}
              {expandedEnclosureId === enclosure.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/30">
                  <AnimalList 
                    enclosureId={enclosure.id}
                    enclosureName={enclosure.name}
                    speciesName={enclosure.animalName}
                    onAnimalsChanged={loadEnclosures}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEnclosure ? 'Edit Enclosure' : 'Add Enclosure'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enclosure Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Frog Tank, Gecko Enclosure #1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Animal Species *
                </label>
                <select
                  value={formData.animalId}
                  onChange={(e) => setFormData(prev => ({ ...prev, animalId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select species...</option>
                  {animalList.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Substrate Type
                </label>
                <select
                  value={formData.substrateType}
                  onChange={(e) => setFormData(prev => ({ ...prev, substrateType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="bioactive">Bioactive</option>
                  <option value="soil">Soil</option>
                  <option value="paper">Paper</option>
                  <option value="sand">Sand</option>
                  <option value="reptile-carpet">Reptile Carpet</option>
                  <option value="tile">Tile</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="Notes about this enclosure..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingEnclosure ? 'Save Changes' : 'Add Enclosure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
