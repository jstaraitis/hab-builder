/**
 * Centralized form styling constants
 * Used across all forms to maintain consistent formatting and styling
 */

export const formStyles = {
  // Form sections
  form: 'space-y-5',
  formGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  formGridSmall: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  fullWidth: 'md:col-span-2',

  // Labels
  label: 'block text-sm font-medium text-secondary mb-2',
  labelRequired: 'block text-sm font-medium text-secondary mb-2',

  // Input fields
  input: `px-3 py-2.5 border border-divider rounded-lg
           bg-card-elevated text-white
           focus:ring-2 focus:ring-accent focus:border-accent`,

  inputFull: `w-full px-3 py-2.5 border border-divider rounded-lg
              bg-card-elevated text-white
              focus:ring-2 focus:ring-accent focus:border-accent`,

  inputSmall: `px-3 py-2 border border-divider rounded-lg
               bg-card-elevated text-white
               focus:ring-2 focus:ring-accent focus:border-accent`,

  // Select fields
  select: `px-3 py-2.5 border border-divider rounded-lg
           bg-card-elevated text-white
           focus:ring-2 focus:ring-accent focus:border-accent appearance-none`,

  selectFull: `w-full px-3 py-2.5 border border-divider rounded-lg
               bg-card-elevated text-white
               focus:ring-2 focus:ring-accent focus:border-accent appearance-none`,

  selectMedium: `px-4 py-2.5 border border-divider rounded-lg
                 bg-card-elevated text-white font-medium
                 focus:ring-2 focus:ring-accent focus:border-accent whitespace-nowrap`,

  // Text areas
  textarea: `w-full px-3 py-2.5 border border-divider rounded-lg
             bg-card-elevated text-white
             focus:ring-2 focus:ring-accent focus:border-accent resize-none`,

  // Input containers
  inputContainer: 'flex gap-2 items-end',
  inputWithUnit: 'flex-1',

  // Helper text
  helperText: 'text-xs text-muted mt-2',
  helperTextSmall: 'text-xs text-muted mt-1',

  // Button containers
  buttonContainer: 'flex gap-3 pt-4',
  buttonContainerEnd: 'flex gap-3 pt-4 justify-end',

  // Buttons
  buttonPrimary: `flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dim 
                  text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`,

  buttonSecondary: `flex items-center gap-2 px-4 py-2.5 bg-card-elevated hover:bg-gray-300 
                    dark:bg-card-elevated dark:hover:bg-card-elevated text-secondary 
                    rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`,

  buttonColorful: (bgColor: string) =>
    `flex items-center gap-2 px-4 py-2.5 ${bgColor} text-white rounded-lg font-medium transition-colors 
     disabled:opacity-50 disabled:cursor-not-allowed`,

  // Form section spacing
  section: 'space-y-5',
  sectionSmall: 'space-y-4',
};

/**
 * Multi-field layout helpers
 */
export const fieldLayouts = {
  // Two column grid (responsive)
  twoColumnGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  
  // Three column grid (responsive)
  threeColumnGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',

  // Input with select (like weight/length with units)
  inputWithSelect: 'flex gap-2 items-end',
  inputWithSelectInput: 'flex-1',
  inputWithSelectSelect: 'px-4 py-2.5 border border-divider rounded-lg bg-card-elevated text-white font-medium focus:ring-2 focus:ring-accent focus:border-accent whitespace-nowrap',
};

/**
 * Checkbox styling
 */
export const checkboxStyles = {
  container: 'flex items-center gap-3',
  checkbox: `w-5 h-5 rounded border-divider text-accent dark:border-divider 
             focus:ring-2 focus:ring-accent cursor-pointer`,
  label: 'text-sm text-secondary cursor-pointer font-medium',
};

/**
 * Badge/tag styling for form displays
 */
export const badgeStyles = {
  small: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
  base: 'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium',
  
  success: 'bg-accent/15 text-accent',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  neutral: 'bg-card-elevated dark:bg-gray-900/30 text-secondary',
};
