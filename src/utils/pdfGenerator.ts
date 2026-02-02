import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
// @ts-ignore - pdfmake types not available
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { BuildPlan, EnclosureInput, ShoppingItem } from '../engine/types';

// Register fonts - pdfFonts is already the vfs object
(pdfMake as any).vfs = pdfFonts;

/**
 * Generate and download a sleek, modern, professional PDF build plan using pdfmake
 */
export function generateBuildPlanPDF(
  plan: BuildPlan,
  input: EnclosureInput,
  animalName: string
): void {
  const temp = plan.careTargets.temperature;
  const humidity = plan.careTargets.humidity;
  const lighting = plan.careTargets.lighting;
  
  // Format temperature text
  let tempText = '';
  if (temp.thermalGradient) {
    tempText = `${temp.coolSide?.min}-${temp.coolSide?.max}°F (cool) → ${temp.warmSide?.min}-${temp.warmSide?.max}°F (warm)`;
    if (temp.basking && typeof temp.basking === 'object') {
      tempText += ` → ${temp.basking.min}-${temp.basking.max}°F (basking)`;
    }
  } else {
    tempText = `${temp.coolSide?.min || temp.min}-${temp.coolSide?.max || temp.max}°F`;
  }
  
  // Group items by category
  const itemsByCategory = plan.shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const categoryOrder = ['enclosure', 'equipment', 'substrate', 'decor', 'cleanup-crew', 'nutrition'];
  const categoryLabels: Record<string, string> = {
    'enclosure': 'Enclosure',
    'equipment': 'Equipment',
    'substrate': 'Substrate',
    'decor': 'Decor & Hides',
    'cleanup-crew': 'Cleanup Crew',
    'nutrition': 'Feeding'
  };

  // Build equipment list content
  const equipmentContent: Content[] = [];
  categoryOrder.forEach((category) => {
    const items = itemsByCategory[category];
    if (!items || items.length === 0) return;

    // Category header
    equipmentContent.push({
      text: categoryLabels[category] || category,
      style: 'categoryHeader',
      margin: [0, 8, 0, 4]
    });

    // Items
    items.forEach((item) => {
      const quantityText = typeof item.quantity === 'number' && item.quantity > 1 ? ` (×${item.quantity})` : '';
      const sizingText = item.sizing ? ` • ${item.sizing}` : '';
      
      equipmentContent.push({
        ul: [
          {
            text: [
              { text: `${item.name}${quantityText}${sizingText}`, style: 'equipmentItem' },
              item.notes ? { text: `\n${item.notes}`, style: 'equipmentNote' } : ''
            ]
          }
        ],
        margin: [0, 0, 0, 4]
      });
    });
  });

  // Build steps content
  const stepsContent: Content[] = plan.steps.map((step, index) => ({
    columns: [
      {
        width: 25,
        table: {
          widths: [20],
          heights: [20],
          body: [[{
            text: `${index + 1}`,
            fillColor: '#16a34a',
            color: '#FFFFFF',
            bold: true,
            fontSize: 11,
            alignment: 'center',
            border: [false, false, false, false]
          }]]
        },
        layout: 'noBorders'
      },
      {
        width: '*',
        stack: [
          { text: step.title, style: 'stepTitle' },
          { text: step.description, style: 'stepDescription', margin: [0, 2, 0, 0] }
        ]
      }
    ],
    margin: [0, 0, 0, 12],
    unbreakable: true
  }));

  // Document definition
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [40, 60, 40, 50],
    
    header: (currentPage) => {
      if (currentPage === 1) {
        return {}; // No header on first page - hero is in content
      } else {
        return {
          stack: [
            {
              table: {
                widths: ['*'],
                heights: [35],
                body: [[{ text: '', fillColor: '#F9FAFB', border: [false, false, false, false] }]]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 0]
            },
            {
              columns: [
                {
                  text: 'Habitat Builder',
                  style: 'headerCompany',
                  width: 'auto'
                },
                {
                  text: ' • ',
                  style: 'headerSeparator',
                  width: 'auto'
                },
                {
                  text: animalName,
                  style: 'headerAnimal',
                  width: '*'
                }
              ],
              margin: [40, -28, 40, 0]
            }
          ]
        };
      }
    },

    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Habitat Builder', style: 'footer' },
        { text: `${currentPage} / ${pageCount}`, style: 'footer', alignment: 'right' }
      ],
      margin: [40, 0, 40, 30]
    }),

    content: [
      // Hero Header (Page 1 only)
      {
        stack: [
          {
            table: {
              widths: ['*'],
              heights: [3, 85],
              body: [
                [{
                  text: '',
                  fillColor: '#15803d',
                  border: [false, false, false, false]
                }],
                [{
                  text: '',
                  fillColor: '#16a34a',
                  border: [false, false, false, false]
                }]
              ]
            },
            layout: 'noBorders',
            margin: [-40, -60, -40, 0]
          },
          {
            text: 'Habitat Builder',
            style: 'companyName',
            margin: [0, -75, 0, 0]
          },
          {
            text: animalName,
            style: 'heroTitle',
            margin: [0, 2, 0, 0]
          },
          {
            text: 'Custom Enclosure Build Plan',
            style: 'heroSubtitle',
            margin: [0, 2, 0, 0]
          },
          {
            text: `${input.bioactive ? 'Bioactive' : 'Standard'} • ${input.setupTier || 'Recommended'} Tier • ${input.quantity} Animal(s)`,
            style: 'heroMeta',
            margin: [0, 4, 0, 10]
          }
        ]
      },


      // Care Parameters Section
      {
        text: 'Care Parameters',
        style: 'sectionHeader',
        margin: [0, 0, 0, 4]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 90, y2: 0, lineWidth: 2, lineColor: '#10B981' }],
        margin: [0, 0, 0, 12]
      },
      {
        table: {
          widths: [532],
          body: [
            [{
              stack: [
                {
                  columns: [
                    { text: 'TEMPERATURE', style: 'paramLabel', margin: [10, 10, 0, 0], width: 80 },
                    { text: tempText, style: 'paramValue', margin: [0, 10, 10, 0], width: '*' }
                  ]
                },
                {
                  columns: [
                    { text: 'HUMIDITY', style: 'paramLabel', margin: [10, 8, 0, 0], width: 80 },
                    { text: `${humidity.day.min}-${humidity.day.max}% (day) • ${humidity.night.min}-${humidity.night.max}% (night)`, style: 'paramValue', margin: [0, 8, 10, 0], width: '*' }
                  ]
                },
                {
                  columns: [
                    { text: 'UVB', style: 'paramLabel', margin: [10, 8, 0, 0], width: 80 },
                    { text: lighting.uvbRequired ? `${lighting.uvbStrength || 'Required'} (${lighting.coveragePercent}% coverage)` : 'Not required', style: 'paramValue', margin: [0, 8, 10, 0], width: '*' }
                  ]
                },
                {
                  columns: [
                    { text: 'PHOTOPERIOD', style: 'paramLabel', margin: [10, 8, 0, 10], width: 80 },
                    { text: lighting.photoperiod, style: 'paramValue', margin: [0, 8, 10, 10], width: '*' }
                  ]
                }
              ],
              fillColor: '#dcfce7',
              border: [true, true, true, true]
            }]
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#16a34a',
          vLineColor: () => '#16a34a'
        },
        margin: [0, 0, 0, 24]
      },

      // Equipment & Supplies Section
      {
        text: 'Equipment & Supplies',
        style: 'sectionHeader',
        margin: [0, 0, 0, 4]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 2, lineColor: '#16a34a' }],
        margin: [0, 0, 0, 12]
      },
      ...equipmentContent,

      // Build Instructions Section
      {
        text: 'Build Instructions',
        style: 'sectionHeader',
        margin: [0, 20, 0, 4],
        pageBreak: 'before'
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 2, lineColor: '#16a34a' }],
        margin: [0, 0, 0, 16]
      },
      ...stepsContent
    ],

    styles: {
      companyName: {
        fontSize: 11,
        bold: true,
        color: '#FFFFFF',
        letterSpacing: 1
      },
      heroTitle: {
        fontSize: 24,
        bold: true,
        color: '#FFFFFF'
      },
      heroSubtitle: {
        fontSize: 10,
        color: '#FFFFFF'
      },
      heroMeta: {
        fontSize: 9,
        color: '#FFFFFF'
      },
      headerCompany: {
        fontSize: 10,
        bold: true,
        color: '#1F2937'
      },
      headerSeparator: {
        fontSize: 10,
        color: '#9CA3AF'
      },
      headerAnimal: {
        fontSize: 10,
        color: '#6B7280'
      },
      cardTitle: {
        fontSize: 11,
        bold: true,
        color: '#1F2937'
      },
      label: {
        fontSize: 9,
        color: '#6B7280',
        bold: false
      },
      value: {
        fontSize: 10,
        bold: true,
        color: '#1F2937'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#1F2937'
      },
      paramLabel: {
        fontSize: 9,
        bold: true,
        color: '#6B7280'
      },
      paramValue: {
        fontSize: 9.5,
        color: '#1F2937'
      },
      categoryHeader: {
        fontSize: 10,
        bold: true,
        color: '#15803d',
        background: '#dcfce7',
        margin: [0, 6, 0, 4]
      },
      equipmentItem: {
        fontSize: 9.5,
        color: '#1F2937'
      },
      equipmentNote: {
        fontSize: 8.5,
        color: '#6B7280',
        italics: false
      },
      stepTitle: {
        fontSize: 10.5,
        bold: true,
        color: '#1F2937'
      },
      stepDescription: {
        fontSize: 9.5,
        color: '#6B7280'
      },
      footer: {
        fontSize: 8,
        color: '#9CA3AF'
      }
    },

    defaultStyle: {
      font: 'Roboto'
    }
  };

  // Generate and download PDF
  const fileName = `${animalName.replace(/[^a-z0-9]/gi, '_')}_Build_Plan.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
}
