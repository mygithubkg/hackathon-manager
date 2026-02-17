import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Command, Zap, Database, Layout, ArrowRight, Layers, Smartphone, Cloud, Users, Bell, Link as LinkIcon, ShieldCheck } from 'lucide-react';

// --- TYPOGRAPHY & GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Space+Grotesk:wght@300;500;700&display=swap');
    
    .font-heading { font-family: 'Space Grotesk', sans-serif; }
    .font-body { font-family: 'Outfit', sans-serif; }
    
    .glass-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .glass-card-hover {
        transition: all 0.3s ease;
    }
    .glass-card-hover:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
    }
  `}</style>
);

// --- COMPONENT: 3D DASHBOARD PREVIEW ---
const DashboardPreview = () => {
  const { scrollYProgress } = useScroll();
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]); // Subtle scale

  return (
    <motion.div
      style={{ rotateX, scale, perspective: "1000px" }}
      className="w-full max-w-5xl mx-auto mt-20 relative z-20"
    >
      <div className="glass-panel rounded-xl p-3 md:p-5 border-t border-white/20 shadow-2xl shadow-indigo-500/10">
        <div className="flex items-center gap-4 mb-6 px-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="h-6 w-32 bg-white/5 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-72 overflow-hidden px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg border border-white/5 p-5 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start text-white/20">
                <div className="w-10 h-10 rounded bg-indigo-500/20" />
                <div className="w-4 h-4 rounded-full bg-white/10" />
              </div>
              <div className="space-y-2 mt-auto">
                <div className="w-3/4 h-4 rounded bg-white/10" />
                <div className="w-1/2 h-3 rounded bg-white/5" />
              </div>
              {/* Simulated Progress Bar */}
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-indigo-500/40 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl -z-10 rounded-[50%]" />
    </motion.div>
  );
};

// --- VISUALIZATIONS FOR FEATURES ---

const TeamPreview = () => (
  <div className="relative w-full h-48 md:h-64 flex items-center justify-center">
    {/* Central Hub */}
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center z-10"
    >
      <Users className="w-6 h-6 text-indigo-300" />
    </motion.div>

    {/* Orbiting Members */}
    {[0, 120, 240].map((deg, i) => (
      <motion.div
        key={i}
        className="absolute w-12 h-12 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: -i * 5 }}
        style={{ rotate: deg, transformOrigin: "50% 120px" }} // simplified orbit logic for CSS/Framer mix
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30"></div>
        {/* Connecting Line (Pseudo) */}
        <div className="absolute top-1/2 left-1/2 w-[120px] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent -translate-x-full -translate-y-1/2 rotate-180 origin-right" />
      </motion.div>
    ))}
    {/* Decoration */}
    <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full" />
  </div>
);

const NotificationPreview = () => (
  <div className="w-full h-full flex flex-col justify-center gap-3 px-8">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ delay: i * 0.2 }}
        viewport={{ once: true }}
        className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-lg backdrop-blur-sm"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-indigo-300" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-2 w-3/4 bg-white/20 rounded-full" />
          <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
        </div>
        <div className="w-2 h-2 rounded-full bg-indigo-400" />
      </motion.div>
    ))}
  </div>
);

const ResourcesPreview = () => (
  <div className="relative w-full h-full flex items-center justify-center p-6">
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
      {['Github', 'Figma', 'Drive', 'Notion'].map((tech, i) => (
        <motion.div
          key={tech}
          whileHover={{ scale: 1.05 }}
          className="aspect-video bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center gap-2"
        >
          <div className={`w-8 h-8 rounded-lg ${i % 2 === 0 ? 'bg-blue-500/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
            <LinkIcon className="w-4 h-4 text-white/50" />
          </div>
          <div className="h-2 w-16 bg-white/10 rounded-full" />
        </motion.div>
      ))}
    </div>
  </div>
);


// --- COMPONENT: FEATURE SECTION (Alternating Layout) ---
const FeatureSection = ({ title, description, badge, Icon, VisualComponent, reversed = false }) => {
  return (
    <section className={`py-20 md:py-32 relative ${reversed ? '' : ''}`}>
      <div className="container mx-auto px-6">
        <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${reversed ? 'lg:flex-row-reverse' : ''}`}>

          {/* Text Content */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-heading font-bold uppercase tracking-widest">
              {badge}
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
              {title}
            </h2>
            <p className="text-lg text-gray-400 font-body leading-relaxed max-w-xl">
              {description}
            </p>

            <div className="flex items-center gap-4 text-sm font-bold font-heading text-white/80">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-500/20"><Zap className="w-3 h-3 text-indigo-400" /></div>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-500/20"><ShieldCheck className="w-3 h-3 text-indigo-400" /></div>
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Report / Visual */}
          <div className="flex-1 w-full">
            <div className="glass-panel aspect-[4/3] rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <VisualComponent />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}


// --- COMPONENT: SPOTLIGHT FEATURE CARD ---
const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onMouseMove={handleMouseMove}
      className="glass-panel group relative overflow-hidden rounded-2xl px-8 py-8 transition-colors hover:bg-white/5"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative z-10">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 shadow-inner">
          <Icon className="h-6 w-6 text-indigo-300" />
        </div>
        <h3 className="mb-3 text-2xl font-heading font-bold text-white">
          {title}
        </h3>
        <p className="text-gray-400 font-body leading-relaxed text-sm">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// --- COMPONENT: TECH STACK BADGES ---
const TechStack = () => (
  <div className="flex flex-wrap justify-center gap-4 opacity-70">
    <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-blue-400"></span> REACT 18
    </span>
    <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-orange-400"></span> FIREBASE
    </span>
    <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> TAILWIND
    </span>
    <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-purple-400"></span> FRAMER MOTION
    </span>
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function LandingPage({ onGetStarted }) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white relative overflow-hidden selection:bg-indigo-500/30">
      <GlobalStyles />

      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[30vw] h-[30vw] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10">

        {/* Navigation */}
        <div className="absolute top-0 w-full pt-8 px-6">
          <nav className="flex justify-between items-center glass-panel rounded-full px-6 py-3 max-w-3xl mx-auto backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-heading font-bold text-sm shadow-lg shadow-indigo-500/20">
                <Command className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold tracking-tight text-lg">Hack<span className="text-indigo-400">Manager</span></span>
            </div>
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-white text-black rounded-full text-xs font-bold font-heading hover:bg-gray-200 transition-colors tracking-wide"
            >
              LAUNCH APP
            </button>
          </nav>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-6 pt-40 pb-20">
          <div className="text-center max-w-5xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-heading font-bold mb-8 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                v2.0 Now Available
              </div>

              <h1 className="text-5xl md:text-8xl font-heading font-bold mb-8 tracking-tight leading-[1.1]">
                Execute Hackathons <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300 animate-gradient-x">
                  With Precision
                </span>
              </h1>

              <p className="text-xl font-body text-gray-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                The all-in-one command center for teams. Manage resources, coordinate tasks, and sync progress in real-time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <button
                  onClick={onGetStarted}
                  className="group relative px-8 py-4 bg-indigo-600 rounded-xl font-heading font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  <span className="flex items-center gap-2 relative z-10">
                    Get Started Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 var-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              <TechStack />

            </motion.div>

            {/* 3D Dashboard Mockup */}
            <DashboardPreview />
          </div>
        </div>

        {/* Detailed Feature Sections */}
        <div className="bg-black/20 backdrop-blur-3xl border-t border-white/5">
          <FeatureSection
            title="Seamless Team Collaboration"
            description="Bring your team together in a unified workspace. Assign roles, track availability, and ensure everyone is aligned on the mission."
            badge="Collaboration"
            VisualComponent={TeamPreview}
          />

          <FeatureSection
            title="Centralized Resource Hub"
            description="Stop digging through chat history for links. Organize GitHub repositories, Figma designs, and Notion docs in one secure vault."
            badge="Asset Management"
            VisualComponent={ResourcesPreview}
            reversed={true}
          />

          <FeatureSection
            title="Stay in Sync, Always"
            description="Real-time notifications keep you updated on critical changes. From deadline alerts to new resource additions, never miss a beat."
            badge="Real-time Updates"
            VisualComponent={NotificationPreview}
          />
        </div>


        {/* Grid Features - Comprehensive List */}
        <div className="container mx-auto px-6 py-32 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Built for High Performance</h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-body">Everything you need to go from idea to deployment, faster than ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">

            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Powered by Vite and optimized React for instant page loads and buttery smooth transitions."
              delay={0.1}
            />
            <FeatureCard
              icon={Cloud}
              title="Cloud Native"
              description="Data persists securely in the cloud with Firebase. Access your workspace from any device."
              delay={0.2}
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile Ready"
              description="Fully responsive interface that adapts perfectly to tablets and mobile phones."
              delay={0.3}
            />
            <FeatureCard
              icon={Database}
              title="Real-time DB"
              description="Collaborate simultaneously with Firestore's real-time data synchronization."
              delay={0.4}
            />
            <FeatureCard
              icon={Layers}
              title="Modular Design"
              description="Clean, component-based architecture making it easy to scale and maintain."
              delay={0.5}
            />
            <FeatureCard
              icon={Layout}
              title="Dark Mode"
              description="Easy on the eyes with a carefully crafted dark theme and glassmorphism accents."
              delay={0.6}
            />

          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 bg-black/40">
          <div className="container mx-auto px-6 flex flex-col items-center">
            <div className="font-heading font-bold text-2xl text-white mb-2 tracking-tight">Hack<span className="text-indigo-400">Manager</span></div>
            <p className="font-body text-gray-500 mb-8 text-center max-w-sm">Empowering developers to build the future, one hackathon at a time.</p>

            <div className="flex gap-6 mb-8">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"><Command className="w-4 h-4" /></div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"><Cloud className="w-4 h-4" /></div>
            </div>

            <p className="font-body text-xs text-gray-700">© 2026 Hackathon Manager. Open Source.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}