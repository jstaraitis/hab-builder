import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TaskCreationModal } from '../CareCalendar/TaskCreationModal';
import { NotificationPrompt } from '../CareCalendar/NotificationPrompt';

export function TaskCreationView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';
  const [showPrompt, setShowPrompt] = useState(false);

  const handleClose = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <TaskCreationModal
        isOpen
        layout="page"
        onClose={handleClose}
        onTaskCreated={() => undefined}
        onNotificationPromptNeeded={() => setShowPrompt(true)}
      />
      <NotificationPrompt
        show={showPrompt}
        onClose={() => setShowPrompt(false)}
      />
    </>
  );
}
