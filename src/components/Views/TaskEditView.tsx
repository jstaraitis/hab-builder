import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TaskEditModal } from '../CareCalendar/TaskEditModal';
import { careTaskService } from '../../services/careTaskService';
import type { CareTask } from '../../types/careCalendar';

export function TaskEditView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const [task, setTask] = useState<CareTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTask = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await careTaskService.getTaskById(id);
        if (!isMounted) return;
        if (!data) {
          setError('Task not found.');
          setTask(null);
          return;
        }
        setTask(data);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load task.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTask();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleClose = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading task...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <TaskEditModal
      task={task}
      isOpen
      layout="page"
      onClose={handleClose}
      onTaskUpdated={() => undefined}
    />
  );
}
