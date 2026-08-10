import React from "react";

const Hero = () => {
  return (
    <section className="relative w-full min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6 md:px-16 overflow-hidden">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
        
        {/* Left Side: Wordings */}
        <div className="flex flex-col items-start justify-center space-y-6 z-10">
          <span className="px-3 py-1 text-xs uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            Unleash the Power
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-neutral-100">
            Kawasaki Ninja <span className="text-emerald-500">H2</span>
          </h1>
          
          <p className="text-neutral-400 text-base md:text-lg max-w-lg leading-relaxed">
            Experience engineered precision and supercharged dominance. Interact with the 3D model on the right—click and drag to rotate the bike in 360 degrees.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#explore"
              className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Explore Features
            </a>
            <a
              href="#contact"
              className="px-6 py-3 rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-semibold text-sm transition-all duration-300 bg-neutral-900/50"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Right Side: Interactive 3D Model */}
        <div className="w-full h-[400px] md:h-[500px] lg:h-[550px] relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 shadow-2xl flex items-center justify-center">
          <iframe
            title="Kawasaki Ninja H2 3D Model"
            className="w-full h-full border-0"
            src="https://sketchfab.com/models/b74ecc39c3414411b62b781243088589/embed?autostart=1&camera=0&preload=1"
            allow="autoplay; fullscreen; execution-while-out-of-viewport; execution-while-not-rendered; web-share"
            allowFullScreen
          />
        </div>

      </div>
    </section>
  );
};

export default Hero;