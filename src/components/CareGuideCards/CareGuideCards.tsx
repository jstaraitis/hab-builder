import { Link } from 'react-router-dom';
import { ExternalLink, Home, Layers, Thermometer, Sun, Utensils, Droplets } from 'lucide-react';
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
      id: getBlogId('enclosure-setup') || getBlogId('sizing'),
      title: 'Enclosure Setup',
      icon: <Home className="w-7 h-7" />,
      gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      linkColor: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
      info: [
        `Minimum: ${profile.minEnclosureSize.width}×${profile.minEnclosureSize.depth}×${profile.minEnclosureSize.height}"`,
        profile.layoutRules.preferVertical ? 'Vertical/Arboreal' : 'Horizontal/Terrestrial',
        profile.bioactiveCompatible ? 'Bioactive Compatible' : 'Non-bioactive recommended'
      ]
    },
    {
      id: getBlogId('substrate'),
      title: 'Substrate',
      icon: <Layers className="w-7 h-7" />,
      gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      linkColor: 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300',
      info: [
        profile.bioactiveCompatible ? 'Soil-based bioactive' : 'Traditional substrate',
        'Proper depth essential',
        'Drainage layer needed'
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
      info: [
        `Temp: ${profile.careTargets.temperature.min}-${profile.careTargets.temperature.max}°F`,
        `Humidity: ${profile.careTargets.humidity.min}-${profile.careTargets.humidity.max}%`,
        profile.careTargets.temperature.basking ? `Basking: ${profile.careTargets.temperature.basking}°F` : 'No basking spot'
      ]
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
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">Complete Care Guides</h3>
        <span className="text-lg text-gray-500 dark:text-gray-400">6 essential guides</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide, index) => (
          guide.id ? (
            <Link
              key={index}
              to={`/blog/${guide.id}`}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${guide.gradient} border-2 ${guide.border} p-5 hover:shadow-lg transition-all hover:scale-[1.02] h-full flex flex-col group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${guide.iconBg} rounded-full p-3`}>
                  <div className={guide.iconColor}>{guide.icon}</div>
                </div>
                <ExternalLink className={`w-5 h-5 ${guide.linkColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
              
              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{guide.title}</h4>
              
              <div className="space-y-2 flex-grow">
                {guide.info.map((item, idx) => (
                  <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className={`${guide.iconColor} mt-0.5`}>•</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
              
              <div className={`mt-4 pt-3 border-t ${guide.border} flex items-center gap-2 text-sm font-semibold ${guide.linkColor}`}>
                Read Full Guide <ExternalLink className="w-4 h-4" />
              </div>
            </Link>
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
