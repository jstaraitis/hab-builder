import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enclosureAnimalService } from '../../services/enclosureAnimalService';
import { WeightTracker } from '../WeightTracking';
import type { EnclosureAnimal } from '../../types/careCalendar';

export function WeightTrackerView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<EnclosureAnimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnimal = async () => {
      if (!id) {
        setError('Animal not found.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await enclosureAnimalService.getAnimalById(id);
        if (!isMounted) return;
        if (!data) {
          setError('Animal not found.');
          setAnimal(null);
          return;
        }
        setAnimal(data);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load animal.');
          setAnimal(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadAnimal();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link
          to="/my-animals"
          className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium"
        >
          Back to My Animals
        </Link>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading weight tracker...
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : animal ? (
        <WeightTracker animal={animal} />
      ) : null}
    </div>
  );
}
