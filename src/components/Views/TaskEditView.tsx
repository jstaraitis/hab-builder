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
      <div className="min-h-screen bg-surface pb-28">
        <div className="animate-pulse space-y-4 px-4 pt-16">
          <div className="h-10 bg-card rounded-2xl w-40" />
          <div className="h-36 bg-card rounded-2xl" />
          <div className="h-48 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface px-4 pt-16">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
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

