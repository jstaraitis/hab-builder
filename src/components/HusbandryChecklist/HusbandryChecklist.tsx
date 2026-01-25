import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import type { HusbandryCareChecklist, ChecklistItem } from '../../engine/husbandryCare';
import { CollapsibleSection } from '../PlanPreview/CollapsibleSection';

interface HusbandryChecklistProps {
  checklist: HusbandryCareChecklist;
}

function ChecklistItemComponent({ item, onChange }: {
  item: ChecklistItem;
  onChange: (id: string, completed: boolean) => void;
}) {
  return (
    <div className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
      <input
        type="checkbox"
        checked={item.completed || false}
        onChange={(e) => onChange(item.id, e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <div className="ml-3 flex-1">
        <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {item.task}
        </p>
        {item.notes && (
          <p className="text-xs text-gray-600 mt-1">
            <Lightbulb className="inline-block w-4 h-4 mr-1 text-yellow-500" /> {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}

interface ChecklistState {
  [key: string]: boolean;
}

export function HusbandryChecklist({ checklist }: HusbandryChecklistProps) {
  const [preBuildChecked, setPreBuildChecked] = useState<ChecklistState>({});
  const [weeklyChecked, setWeeklyChecked] = useState<ChecklistState>({});
  const [monthlyChecked, setMonthlyChecked] = useState<ChecklistState>({});

  const handlePreBuildChange = (id: string, completed: boolean) => {
    setPreBuildChecked(prev => ({ ...prev, [id]: completed }));
  };

  const handleWeeklyChange = (id: string, completed: boolean) => {
    setWeeklyChecked(prev => ({ ...prev, [id]: completed }));
  };

  const handleMonthlyChange = (id: string, completed: boolean) => {
    setMonthlyChecked(prev => ({ ...prev, [id]: completed }));
  };

  const preBuildCount = Object.values(preBuildChecked).filter(Boolean).length;
  const weeklyCount = Object.values(weeklyChecked).filter(Boolean).length;
  const monthlyCount = Object.values(monthlyChecked).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <CollapsibleSection 
        title={`Pre-Build Checklist (${preBuildCount}/${checklist.preBuild.length})`}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {checklist.preBuild.map(item => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              onChange={handlePreBuildChange}
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        title={`Weekly Maintenance (${weeklyCount}/${checklist.weeklyMaintenance.length})`}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {checklist.weeklyMaintenance.map(item => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              onChange={handleWeeklyChange}
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        title={`Monthly Maintenance (${monthlyCount}/${checklist.monthlyMaintenance.length})`}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {checklist.monthlyMaintenance.map(item => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              onChange={handleMonthlyChange}
            />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
