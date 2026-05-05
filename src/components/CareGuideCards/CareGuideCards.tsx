import { Link } from 'react-router-dom';
import { ExternalLink, Home, Thermometer, Sun, Utensils, Droplets, Heart } from 'lucide-react';
import type { AnimalProfile } from '../../engine/types';
import { useUnits } from '../../contexts/UnitsContext';
import { formatTemp, formatDimensions } from '../../utils/unitConversion';

interface CareGuideCardsProps {
  profile: AnimalProfile;
}

export function CareGuideCards({ profile }: CareGuideCardsProps) {
  const { isMetric } = useUnits();
  
  // Helper to find specific blog IDs
  const getBlogId = (keyword: string): string | undefined => {
    return profile.relatedBlogs?.find(id => id.includes(keyword));
  };

  const guides = [
    {
      id: getBlogId('enclosure') || getBlogId('sizing'),
      secondaryId: getBlogId('substrate'),
      title: 'Housing Guide',
      icon: <Home className="w-7 h-7" />,
      gradient: 'from-jade-50 to-teal-50 dark:from-card dark:to-card-elevated',
      border: 'border-jade-200 dark:border-jade-700',
      iconBg: 'bg-jade-100 dark:bg-jade-900/40',
      iconColor: 'text-jade-600 dark:text-accent',
      linkColor: 'text-jade-600 dark:text-accent hover:text-jade-700 dark:hover:text-jade-300',
      info: [
        `Minimum: ${formatDimensions(profile.minEnclosureSize.width, profile.minEnclosureSize.depth, profile.minEnclosureSize.height, isMetric)}`,
        profile.layoutRules.preferVertical ? 'Vertical/Arboreal' : 'Horizontal/Terrestrial',
        profile.bioactiveCompatible ? 'Bioactive compatible' : 'Traditional substrate'
      ]
    },
    {
      id: getBlogId('temp-humidity') || getBlogId('temperature'),
      title: 'Temperature & Humidity',
      icon: <Thermometer className="w-7 h-7" />,
      gradient: 'from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10',
      border: 'border-red-200 dark:border-red-700',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-300',
      linkColor: 'text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200',
      info: (() => {
        const isAquatic = profile.careTargets.humidity.day.min === 100 && profile.careTargets.humidity.day.max === 100;
        
        if (isAquatic) {
          return [
            `Temp: ${formatTemp(profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min, isMetric)}-${formatTemp(profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max, isMetric)}`,
            'Fully aquatic species',
            'Humidity not applicable'
          ];
        }
        
        const result: string[] = [];
        
        if (profile.careTargets.temperature.thermalGradient) {
          // Show cool and warm sides
          result.push(`Cool Side: ${formatTemp(profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min, isMetric)}-${formatTemp(profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max, isMetric)}`);
          result.push(`Warm Side: ${formatTemp(profile.careTargets.temperature.warmSide?.min ?? profile.careTargets.temperature.min, isMetric)}-${formatTemp(profile.careTargets.temperature.warmSide?.max ?? profile.careTargets.temperature.max, isMetric)}`);
        } else {
          // No gradient - show single temperature
          result.push(`Temp: ${formatTemp(profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min, isMetric)}-${formatTemp(profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max, isMetric)}`);
        }
        
        // Add basking if present
        const basking = profile.careTargets.temperature.basking;
        if (basking !== null && basking !== undefined) {
          const baskingTemp = typeof basking === 'number' 
            ? formatTemp(basking, isMetric)
            : `${formatTemp(basking.min, isMetric)}-${formatTemp(basking.max, isMetric)}`;
          result.push(`Basking: ${baskingTemp}`);
        }
        
        // Add nighttime if different from daytime
        const nighttime = profile.careTargets.temperature.nighttime;
        const coolMin = profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min;
        const coolMax = profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max;
        if (nighttime && (nighttime.min !== coolMin || nighttime.max !== coolMax)) {
          result.push(`Night: ${formatTemp(nighttime.min, isMetric)}-${formatTemp(nighttime.max, isMetric)}`);
        }
        
        // Add humidity
        result.push(`Humidity: ${profile.careTargets.humidity.day.min}-${profile.careTargets.humidity.day.max}%`);
        
        return result;
      })()
    },
    {
      id: getBlogId('lighting') || getBlogId('uvb'),
      title: 'Lighting & UVB',
      icon: <Sun className="w-7 h-7" />,
      gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10',
      border: 'border-amber-200 dark:border-amber-700',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-300',
      linkColor: 'text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200',
      info: [
        profile.careTargets.lighting.uvbRequired ? 'UVB Required' : 'UVB Recommended',
        profile.careTargets.lighting.uvbStrength ? `${profile.careTargets.lighting.uvbStrength} bulb` : 'No UVB needed',
        profile.careTargets.lighting.photoperiod || '12h day/night'
      ]
    },
    {
      id: getBlogId('feeding'),
      title: 'Feeding Guide',
      icon: <Utensils className="w-7 h-7" />,
      gradient: 'from-jade-50 to-emerald-50 dark:from-card dark:to-card-elevated',
      border: 'border-jade-200 dark:border-jade-700',
      iconBg: 'bg-jade-100 dark:bg-jade-900/40',
      iconColor: 'text-jade-600 dark:text-accent',
      linkColor: 'text-jade-600 dark:text-accent hover:text-jade-700 dark:hover:text-jade-300',
      info: profile.careGuidance?.feedingRequirements?.slice(0, 3) || [
        profile.dietType || 'Carnivore',
        'Age-based schedules',
        'Supplementation required'
      ]
    },
    {
      id: getBlogId('hydration') || getBlogId('water'),
      title: 'Hydration & Water',
      icon: <Droplets className="w-7 h-7" />,
      gradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10',
      border: 'border-cyan-200 dark:border-cyan-700',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
      iconColor: 'text-cyan-600 dark:text-cyan-300',
      linkColor: 'text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200',
      info: profile.careGuidance?.waterNotes?.slice(0, 3) || [
        'Fresh water daily',
        'Bowl cleaning essential',
        'Misting schedule'
      ]
    },
    {
      id: getBlogId('enrichment') || getBlogId('welfare'),
      title: 'Enrichment & Welfare',
      icon: <Heart className="w-7 h-7" />,
      gradient: 'from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10',
      border: 'border-rose-200 dark:border-rose-700',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-300',
      linkColor: 'text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200',
      info: [
        'Behavioral health',
        'Mental stimulation',
        'Quality of life'
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-divider p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white">Complete Care Guides</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {guides.map((guide, index) => (
          guide.id ? (
            <div
              key={index}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${guide.gradient} border-2 ${guide.border} p-3 sm:p-4 h-full flex flex-col`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`${guide.iconBg} rounded-full p-2`}>
                  <div className={guide.iconColor}>{guide.icon}</div>
                </div>
              </div>
              
              <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-2">{guide.title}</h4>
              
              <div className="space-y-1.5 flex-grow">
                {guide.info.map((item, idx) => (
                  <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className={`${guide.iconColor} mt-0.5`}>•</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
              
              {guide.secondaryId ? (
                <div className={`mt-3 pt-2 border-t ${guide.border} space-y-1.5`}>
                  <Link
                    to={`/blog/${guide.id}`}
                    className={`flex items-center gap-2 text-sm font-semibold ${guide.linkColor} hover:underline group`}
                  >
                    Enclosure Sizing <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <Link
                    to={`/blog/${guide.secondaryId}`}
                    className={`flex items-center gap-2 text-sm font-semibold ${guide.linkColor} hover:underline group`}
                  >
                    Substrate Guide <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              ) : (
                <Link
                  to={`/blog/${guide.id}`}
                  className={`mt-4 pt-3 border-t ${guide.border} flex items-center gap-2 text-sm font-semibold ${guide.linkColor} hover:underline group`}
                >
                  Read Full Guide <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )}
            </div>
          ) : (
            <div
              key={index}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${guide.gradient} border-2 ${guide.border} border-dashed p-5 opacity-50 h-full flex flex-col`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${guide.iconBg} rounded-full p-3 opacity-50`}>
                  <div className={guide.iconColor}>{guide.icon}</div>
                </div>
              </div>
              
              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{guide.title}</h4>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Guide coming soon
              </p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
