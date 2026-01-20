import { animalList } from '../../data/animals';

interface AnimalPickerProps {
  selected: string;
  onSelect: (animalId: string) => void;
}

export function AnimalPicker({ selected, onSelect }: AnimalPickerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Select Animal</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {animalList.map((animal) => (
          <button
            key={animal.id}
            onClick={() => onSelect(animal.id)}
            className={`p-6 rounded-lg border-2 transition-all ${
              selected === animal.id
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md bg-white dark:bg-gray-700'
            }`}
          >
            <div className="text-5xl mb-3">{animal.image}</div>
            <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-1">
              {animal.name}
            </h3>
            <span className="inline-block px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/50 rounded">
              Beginner Friendly
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
