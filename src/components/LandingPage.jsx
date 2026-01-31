import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Command, Zap, Database, Layout, ArrowRight, Layers, Smartphone, Cloud } from 'lucide-react';

// --- TYPOGRAPHY & GLOBAL STYLES ---
// Using the premium fonts you requested, but keeping the data real.
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
  `}</style>
);

// --- COMPONENT: 3D DASHBOARD PREVIEW ---
// This visualizes the "Real-Time Dashboard" mentioned in your README features
const DashboardPreview = () => {
  const { scrollYProgress } = useScroll();
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

  return (
    <motion.div 
      style={{ rotateX, scale, perspective: "1000px" }}
      className="w-full max-w-4xl mx-auto mt-20 relative z-20"
    >
      <div className="glass-panel rounded-xl p-2 md:p-4 border-t border-white/20">
        {/* Abstract representation of your Grid Layout */}
        <div className="flex items-center gap-4 mb-6 px-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="h-6 w-32 bg-white/5 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-64 overflow-hidden">
          {/* Hackathon Cards Representation */}
          {[1, 2, 3].map((i) => (
             <div key={i} className="bg-white/5 rounded-lg border border-white/5 p-4 flex flex-col gap-3">
                <div className="w-8 h-8 rounded bg-indigo-500/20" />
                <div className="w-3/4 h-4 rounded bg-white/10" />
                <div className="w-1/2 h-4 rounded bg-white/5" />
             </div>
          ))}
        </div>
      </div>
      {/* Glow under the dashboard */}
      <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl -z-10 rounded-[50%]" />
    </motion.div>
  );
};

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
        <p className="text-gray-400 font-body leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// --- COMPONENT: TECH STACK BADGES ---
// Replaces the fake "Trusted By" with real info from your README
const TechStack = () => (
  <div className="flex flex-wrap justify-center gap-4 opacity-70">
     <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
       <span className="w-2 h-2 rounded-full bg-blue-400"></span> REACT 18.3
     </span>
     <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
       <span className="w-2 h-2 rounded-full bg-orange-400"></span> FIREBASE 12.8
     </span>
     <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
       <span className="w-2 h-2 rounded-full bg-cyan-400"></span> TAILWIND 3.4
     </span>
     <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-heading font-bold flex items-center gap-2">
       <span className="w-2 h-2 rounded-full bg-purple-400"></span> VITE 5.1
     </span>
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function LandingPage({ onGetStarted }) {
  const containerRef = useRef(null);
  
  return (
    <div ref={containerRef} className="min-h-screen bg-[#030303] text-white relative overflow-hidden selection:bg-indigo-500/30">
      <GlobalStyles />
      
      {/* Background Mesh (Same as before, purely aesthetic) */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px]" />
         <div className="absolute top-[40%] right-[-10%] w-[30vw] h-[30vw] bg-purple-600/10 rounded-full blur-[100px]" />
         {/* Noise Overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="container mx-auto px-6 pt-8 pb-20 relative z-10">
        
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-24 glass-panel rounded-full px-6 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-heading font-bold text-sm">
              <Command className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold tracking-tight">HackMa</span>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold font-heading hover:scale-105 transition-transform"
          >
            LAUNCH APP
          </button>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-heading font-bold mb-8 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Status: Fully Functional
            </div>

            <h1 className="text-5xl md:text-8xl font-heading font-bold mb-6 tracking-tight leading-[1.1]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-600">
                Centralized
              </span>
              <br />
              <span className="relative">
                Hackathon Manager
              </span>
            </h1>

            <p className="text-lg md:text-xl font-body text-gray-400 mb-10 max-w-2xl mx-auto font-light">
              Manage resources, tracks, and progress in one place. 
              Securely stored in the cloud and synced in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-indigo-600 rounded-lg font-heading font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                <span className="flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              
            
            </div>
            
            {/* Tech Stack Display */}
            <TechStack />
            
          </motion.div>

          {/* 3D Dashboard Mockup */}
          <DashboardPreview />
        </div>

        {/* Feature Grid - Based Strictly on README Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto mt-24">
          
          <FeatureCard 
            icon={Zap}
            title="Real-Time Dashboard"
            description="See all your hackathons in a responsive grid layout. Changes sync instantly across all connected devices."
            delay={0.1}
          />
          <FeatureCard 
            icon={Cloud}
            title="Cloud Sync"
            description="Data is stored securely in Firebase Firestore. No data loss when clearing browser cache."
            delay={0.2}
          />
          <FeatureCard 
            icon={Layers}
            title="Resource Manager"
            description="Add, edit, and organize links (GitHub, Figma, Notion) for each project efficiently."
            delay={0.3}
          />
          <FeatureCard 
            icon={Layout}
            title="Modern UI/UX"
            description="Dark mode aesthetic with glassmorphism effects and smooth transitions powered by Framer Motion."
            delay={0.4}
          />
           <FeatureCard 
            icon={Smartphone}
            title="Fully Responsive"
            description="Optimized experience for desktop, tablet, and mobile views so you can manage on the go."
            delay={0.5}
          />
           <FeatureCard 
            icon={Database}
            title="Secure Storage"
            description="Your hackathon data is backed by Google's infrastructure via Firebase for reliability."
            delay={0.6}
          />
          
        </div>

        {/* Footer */}
        <footer className="mt-32 border-t border-white/10 pt-12 flex flex-col items-center text-gray-600 text-sm">
          <div className="font-heading font-bold text-lg text-white mb-2">Hackathon Command Center</div>
          <p className="font-body mb-4">Built with React + Vite + Firebase.</p>
          <p className="font-body opacity-50">© 2026. Open Source.</p>
        </footer>
      </div>
    </div>
  );
}