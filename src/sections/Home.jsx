import React from "react";

const Home = () => {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#030712] py-12">
      {/* Ambient Violet/Indigo Glow Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="relative z-10 w-full max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Hero Content */}
        <div className="text-left space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Hi, I'm <br />
            <span className="text-blue-400 drop-shadow-[0_0_25px_rgba(96,165,250,0.4)]">
              Vishesh R S
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 font-light max-w-xl leading-relaxed">
            Mechanical Engineering Student & CAD / Simulation Specialist. Transforming theoretical physics into functional design.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-start items-center">
            <a
              href="#projects"
              className="w-full sm:w-auto text-center px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="w-full sm:w-auto text-center px-8 py-3 border border-white/20 hover:border-white/60 hover:bg-white/5 text-white font-medium rounded-lg transition-all duration-300"
            >
              Get In Touch
            </a>
          </div>
        </div>

        {/* Right Side: Clean 3D Bike Canvas (Overlays Fully Cropped Out) */}
        <div className="w-full h-[450px] sm:h-[550px] lg:h-[600px] relative overflow-hidden flex items-center justify-center rounded-xl bg-transparent">
          <iframe
            title="Kawasaki Ninja H2 3D Model"
            className="w-full h-[140%] -mt-[20%] -mb-[20%] border-0 bg-transparent"
            src="https://sketchfab.com/models/b74ecc39c3414411b62b781243088589/embed?autostart=1&transparent=1&ui_controls=0&ui_infos=0&ui_inspector=0&ui_watermark=0&ui_hint=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0"
            allow="autoplay; fullscreen; execution-while-out-of-viewport; execution-while-not-rendered"
          />
        </div>

      </div>
    </div>
  );
};

export default Home;