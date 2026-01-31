import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionTemplate } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Command, Sparkles } from 'lucide-react';

// --- TYPOGRAPHY & GLOBAL STYLES (Shared with Landing Page) ---
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

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // --- 3D TILT LOGIC ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth rotation based on mouse position
  const rotateX = useTransform(y, [-100, 100], [5, -5]); // Inverted for natural tilt
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Calculate center of the card
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Set x/y values relative to center
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login();
    } catch (error) {
      console.error("Failed to log in", error);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to log in. ";
      if (error.code === 'auth/internal-error') {
        errorMessage += "Please ensure Google Sign-In is enabled in Firebase Console (Authentication > Sign-in method > Google).";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage += "This domain is not authorized. Add it in Firebase Console (Authentication > Settings > Authorized domains).";
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30">
      <GlobalStyles />

      {/* --- AMBIENT BACKGROUND (Matches Landing Page) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        {/* Noise Overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ perspective: 1000 }} // Essential for 3D effect
        className="relative z-10 w-full max-w-md"
      >
        {/* --- 3D INTERACTIVE CARD --- */}
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="glass-panel rounded-2xl p-1 bg-gradient-to-br from-white/10 to-transparent"
        >
          <div className="bg-black/40 backdrop-blur-xl rounded-xl p-8 border border-white/5 relative overflow-hidden">
            
            {/* Spotlight Gradient following mouse inside the card */}
            <motion.div
              className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
              style={{
                background: useMotionTemplate`
                  radial-gradient(
                    400px circle at ${x}px ${y}px,
                    rgba(79, 70, 229, 0.15),
                    transparent 80%
                  )
                `,
              }}
            />

            <div className="flex flex-col items-center text-center space-y-8 relative z-20">
              
              {/* Logo / Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative">
                  <Command className="w-8 h-8 text-indigo-400" />
                </div>
                {/* Status Dot */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#030303] rounded-full flex items-center justify-center">
                   <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-heading font-bold text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-gray-400 font-body text-sm max-w-[260px] mx-auto leading-relaxed">
                  Enter the command center to manage your hackathon resources.
                </p>
              </div>

              {/* Enhanced Google Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-black rounded-xl font-heading font-bold transition-all duration-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gray-200/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <>
                    <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="relative z-10">Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Decorative bottom text */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
               <Sparkles className="w-3 h-3 text-indigo-400" />
               <p className="text-[10px] text-gray-500 font-heading uppercase tracking-widest">
                 Secured by Firebase Auth
               </p>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}