import type { BuildPlan, EnclosureInput } from '../../engine/types';
import { CareTargets } from './CareTargets';
import { ShoppingList } from '../ShoppingList/ShoppingList';
import { BuildSteps } from '../BuildSteps/BuildSteps';
import { Warnings } from '../Warnings/Warnings';
import { HusbandryChecklist } from '../HusbandryChecklist/HusbandryChecklist';
import { CollapsibleSection } from './CollapsibleSection';
import { EnclosureDesigner } from '../EnclosureDesigner/EnclosureDesigner';

interface PlanPreviewProps {
  readonly plan: BuildPlan;
  readonly enclosureInput: EnclosureInput;
}

export function PlanPreview({ plan, enclosureInput }: PlanPreviewProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Build Plan: {plan.metadata.animalSpecies}
        </h2>
        <p className="text-sm text-gray-600">
          Generated {new Date(plan.metadata.generatedAt).toLocaleDateString()}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          {plan.species?.careLevel && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Care: {plan.species.careLevel}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            Temp: {plan.careTargets.temperature.min}–{plan.careTargets.temperature.max}°{plan.careTargets.temperature.unit}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Humidity: {plan.careTargets.humidity.min}–{plan.careTargets.humidity.max}{plan.careTargets.humidity.unit}
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            UVB: {plan.careTargets.lighting.uvbRequired ? `${plan.careTargets.lighting.uvbStrength ?? 'Required'}` : 'Not required'}
          </span>
          {plan.species?.bioactiveCompatible !== undefined && (
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              {plan.species.bioactiveCompatible ? 'Bioactive OK' : 'Bioactive: caution'}
            </span>
          )}
        </div>
      </div>

      {plan.warnings.length > 0 && (
        <CollapsibleSection title="Safety & Important Notes">
          <Warnings warnings={plan.warnings} showHeader={false} />
        </CollapsibleSection>
      )}
      
      <CollapsibleSection title="Care Parameters">
        <CareTargets targets={plan.careTargets} showHeader={false} />
      </CollapsibleSection>

      <CollapsibleSection title="Feeding & Water">
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="bg-emerald-50 border border-emerald-100 rounded p-3">
            <p className="font-semibold text-emerald-800 mb-2">Feeding</p>
            <ul className="list-disc list-inside space-y-1">
              {plan.careGuidance.feedingNotes.map((note, idx) => (
                <li key={`feeding-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded p-3">
            <p className="font-semibold text-blue-800 mb-2">Water</p>
            <ul className="list-disc list-inside space-y-1">
              {plan.careGuidance.waterNotes.map((note, idx) => (
                <li key={`water-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded p-3">
            <p className="font-semibold text-cyan-800 mb-2">Misting</p>
            <ul className="list-disc list-inside space-y-1">
              {plan.careGuidance.mistingNotes.map((note, idx) => (
                <li key={`misting-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Layout Preview" defaultOpen={true}>
        <EnclosureDesigner 
          enclosureInput={enclosureInput}
          shoppingList={plan.shoppingList}
        />
        
        {plan.layout.notes.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">Layout Notes:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              {plan.layout.notes.map((note, idx) => (
                <li key={`layout-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Shopping List">
        <ShoppingList items={plan.shoppingList} budget={plan.enclosure.budget} showHeader={false} />
      </CollapsibleSection>
      
      <CollapsibleSection title="Build Steps">
        <BuildSteps steps={plan.steps} showHeader={false} />
      </CollapsibleSection>

      <CollapsibleSection title="Husbandry Checklists">
        <HusbandryChecklist checklist={plan.husbandryChecklist} />
      </CollapsibleSection>
    </div>
  );
}
