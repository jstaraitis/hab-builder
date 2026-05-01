import { SEO } from '../SEO/SEO';
import { CheckCircle2, Clock, Flame, Zap, Circle, MessageSquarePlus, Squirrel, Image, HelpCircle, Smartphone, ListTree, DollarSign, FileText, Box, ClipboardCheck, Users, Save, Hammer, Scale, CloudSun, Leaf, MessageCircle, Wrench } from 'lucide-react';

interface RoadmapItemProps {
  readonly title: string;
  readonly description: string;
  readonly status: 'completed' | 'in-progress' | 'planned';
  readonly priority?: 'high' | 'medium' | 'low';
  readonly eta?: string;
  readonly icon?: React.ReactNode;
}

function RoadmapItem({ title, description, status, priority, eta, icon }: RoadmapItemProps) {
  const statusConfig = {
    completed: { 
      accent: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/15 border border-emerald-500/30',
      badgeText: 'text-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: 'Done'
    },
    'in-progress': { 
      accent: 'bg-sky-500',
      badgeBg: 'bg-sky-500/15 border border-sky-500/30',
      badgeText: 'text-sky-300',
      icon: <Wrench className="w-4 h-4" />,
      label: 'Building'
    },
    planned: { 
      accent: 'bg-slate-500',
      badgeBg: 'bg-slate-500/15 border border-slate-500/30',
      badgeText: 'text-slate-300',
      icon: <Clock className="w-4 h-4" />,
      label: 'Soon'
    },
  };

  const priorityConfig = {
    high: { icon: <Flame className="w-3.5 h-3.5" />, text: 'High Priority', color: 'text-rose-300 bg-rose-500/15 border border-rose-500/25' },
    medium: { icon: <Zap className="w-3.5 h-3.5" />, text: 'Medium', color: 'text-amber-300 bg-amber-500/15 border border-amber-500/25' },
    low: { icon: <Circle className="w-3.5 h-3.5" />, text: 'Low Priority', color: 'text-slate-300 bg-slate-500/15 border border-slate-500/25' },
  };

  const config = statusConfig[status];
  const priorityInfo = priority ? priorityConfig[priority] : null;

  return (
    <div className="bg-card border border-divider rounded-2xl p-5 transition-colors hover:border-accent/50">
      <div className={`w-12 h-1 rounded-full mb-4 ${config.accent}`} />
      <div className="flex items-start gap-3 sm:gap-4">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="p-2 bg-accent/15 rounded-xl">
              {icon}
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-white text-base sm:text-lg">{title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}>
                {config.icon}
                {config.label}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted leading-relaxed mb-2">{description}</p>
          
          <div className="flex items-center gap-3 flex-wrap">
            {priorityInfo && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${priorityInfo.color}`}>
                {priorityInfo.icon}
                {priorityInfo.text}
              </span>
            )}
            {eta && (
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {eta}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RoadmapProps {
  readonly onOpenFeedback: () => void;
}

export function Roadmap({ onOpenFeedback }: RoadmapProps) {
  return (
    <>
      <SEO
        title="Roadmap - Habitat Builder"
        description="See what's coming next for Habitat Builder. Track new features, animal profiles, and community tools in development."
        keywords={['habitat builder roadmap', 'upcoming features', 'reptile tool updates', 'development plans']}
      />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-accent to-teal-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">What We're Building</h1>
          <p className="text-base md:text-lg text-white/80">
            Here's what we're cooking up and what's on deck
          </p>
        </div>

        <section className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Recently Completed
          </h2>
          <div className="space-y-3">
            <RoadmapItem
              title="Animal Browser"
              description="Browse species with filters for experience level, space requirements, and care difficulty to find your perfect match."
              status="completed"
              icon={<ListTree className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <RoadmapItem
              title="Care Checklists"
              description="Daily, weekly, and monthly maintenance tasks tailored to your animal and setup type."
              status="completed"
              icon={<ClipboardCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
            />
            <RoadmapItem
              title="Care Guide Library"
              description="Species-specific guides that cover setup, substrate, heating, feeding, and safety."
              status="completed"
              icon={<HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            />
          </div>
        </section>

        <section className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-500" />
            Currently Building
          </h2>
          <div className="space-y-3">
            <RoadmapItem
              title="More Species"
              description="Adding your favorite reptiles and amphibians—we're working through the most-requested species every month."
              status="in-progress"
              priority="high"
              icon={<Squirrel className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <RoadmapItem
              title="Example Setup Gallery"
              description="Real enclosure photos and builds from the community to spark your creativity and show what's possible."
              status="in-progress"
              priority="medium"
              icon={<Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            />
            <RoadmapItem
              title="Mobile Experience Polish"
              description="Making the mobile app buttery smooth with better layouts, faster loading, and bug fixes based on your feedback."
              status="in-progress"
              priority="medium"
              icon={<Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            />
          </div>
        </section>

        <section className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-500" />
            Up Next
          </h2>
          <div className="space-y-3">
            <RoadmapItem
              title="Budget Calculator"
              description="See how much your setup will actually cost before you buy anything—no more surprise expenses."
              status="planned"
              priority="medium"
              icon={<DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />}
            />
            <RoadmapItem
              title="PDF Export"
              description="Download your complete build plan as a PDF to reference while shopping or building your enclosure."
              status="planned"
              priority="medium"
              icon={<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            />
            <RoadmapItem
              title="3D Preview"
              description="See your enclosure in 3D before you build it—visualize equipment placement and decoration layout."
              status="planned"
              priority="medium"
              icon={<Box className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            />
            <RoadmapItem
              title="Community Gallery"
              description="Check out real setups from other keepers for inspiration, ideas, and to see what actually works."
              status="planned"
              priority="low"
              icon={<Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
            />
          </div>
        </section>

        <section className="bg-card border border-divider rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquarePlus className="w-6 h-6 text-indigo-500" />
            Ideas We're Considering
          </h2>
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-white/80">These are on our radar but need more feedback. Tell us what you'd actually use most.</p>
          </div>
          <ul className="space-y-3 text-muted text-sm">
              <li className="flex items-start gap-3">
                <Save className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Saved Designs:</strong> Create an account to save multiple plans and compare different setups side-by-side
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Hammer className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">DIY Builder Mode:</strong> Custom wood or PVC enclosure plans with cut lists, material estimates, and assembly guides
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Species Comparison:</strong> Compare care requirements between different animals when deciding what to get
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CloudSun className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Climate Tuning:</strong> Adjust equipment recommendations based on where you live (hot, cold, humid, dry)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Plant Library:</strong> Searchable database of bioactive-safe plants with care requirements and toxicity info
                </div>
              </li>
            </ul>
        </section>

        <section className="bg-gradient-to-r from-accent to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-7 h-7" />
            <h2 className="text-2xl font-bold">Got Ideas or Feedback?</h2>
          </div>
          <p className="mb-4 text-emerald-50">
            This tool is built <em>for</em> the community, <em>by</em> the community. Help us make it better:
          </p>
          <ul className="space-y-2 text-emerald-50 mb-6">
            <li className="flex items-start gap-2">
              <Squirrel className="w-4 h-4 flex-shrink-0 mt-1" />
              <span>Request species you want to see added</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-1" />
              <span>Report bugs or incorrect care info</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-4 h-4 flex-shrink-0 mt-1" />
              <span>Suggest features you'd actually use</span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="w-4 h-4 flex-shrink-0 mt-1" />
              <span>Share your expertise to help improve care guides</span>
            </li>
          </ul>
          <button
            onClick={onOpenFeedback}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-accent font-semibold rounded-xl hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            Send Us Your Thoughts
          </button>
        </section>

        <div className="text-center text-muted text-sm pb-6">
          <p>We update this roadmap regularly based on what you tell us matters most.</p>
        </div>
      </div>
    </>
  );
}
