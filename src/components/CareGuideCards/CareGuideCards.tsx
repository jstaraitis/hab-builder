import { Link } from 'react-router-dom';
import { ExternalLink, Home, Thermometer, Sun, Utensils, Droplets, Heart } from 'lucide-react';
import type { AnimalProfile } from '../../engine/types';

interface CareGuideCardsProps {
  profile: AnimalProfile;
}

export function CareGuideCards({ profile }: CareGuideCardsProps) {
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
      gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      linkColor: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
      info: [
        `Minimum: ${profile.minEnclosureSize.width}×${profile.minEnclosureSize.depth}×${profile.minEnclosureSize.height}"`,
        profile.layoutRules.preferVertical ? 'Vertical/Arboreal' : 'Horizontal/Terrestrial',
        profile.bioactiveCompatible ? 'Bioactive compatible' : 'Traditional substrate'
      ]
    },
    {
      id: getBlogId('temp-humidity') || getBlogId('temperature'),
      title: 'Temperature & Humidity',
      icon: <Thermometer className="w-7 h-7" />,
      gradient: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
      border: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      linkColor: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
      info: (() => {
        const isAquatic = profile.careTargets.humidity.day.min === 100 && profile.careTargets.humidity.day.max === 100;
        
        if (isAquatic) {
          return [
            `Temp: ${profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min}-${profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max}°F`,
            'Fully aquatic species',
            'Humidity not applicable'
          ];
        }
        
        const result: string[] = [];
        
        if (profile.careTargets.temperature.thermalGradient) {
          // Show cool and warm sides
          result.push(`Cool Side: ${profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min}-${profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max}°F`);
          result.push(`Warm Side: ${profile.careTargets.temperature.warmSide?.min ?? profile.careTargets.temperature.min}-${profile.careTargets.temperature.warmSide?.max ?? profile.careTargets.temperature.max}°F`);
        } else {
          // No gradient - show single temperature
          result.push(`Temp: ${profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min}-${profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max}°F`);
        }
        
        // Add basking if present
        const basking = profile.careTargets.temperature.basking;
        if (basking !== null && basking !== undefined) {
          const baskingTemp = typeof basking === 'number' 
            ? `${basking}°F` 
            : `${basking.min}-${basking.max}°F`;
          result.push(`Basking: ${baskingTemp}`);
        }
        
        // Add nighttime if different from daytime
        const nighttime = profile.careTargets.temperature.nighttime;
        const coolMin = profile.careTargets.temperature.coolSide?.min ?? profile.careTargets.temperature.min;
        const coolMax = profile.careTargets.temperature.coolSide?.max ?? profile.careTargets.temperature.max;
        if (nighttime && (nighttime.min !== coolMin || nighttime.max !== coolMax)) {
          result.push(`Night: ${nighttime.min}-${nighttime.max}°F`);
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
      gradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      linkColor: 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300',
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
      gradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      linkColor: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
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
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      linkColor: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
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
      gradient: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      iconColor: 'text-rose-600 dark:text-rose-400',
      linkColor: 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300',
      info: [
        'Behavioral health',
        'Mental stimulation',
        'Quality of life'
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
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
