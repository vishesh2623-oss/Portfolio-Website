import React from "react";

const Home = () => {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#030712]">
      {/* Subtle glowing ambient background accents for high-end look */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Text Content */}
      <div className="relative z-10 text-center max-w-4xl px-6 space-y-6">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight">
          Hi, I'm <span className="text-blue-400 drop-shadow-[0_0_25px_rgba(96,165,250,0.4)]">Vishesh R S</span>
        </h1>

        <p className="text-lg sm:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
          Mechanical Engineering Student & CAD / Simulation Specialist. Transforming theoretical physics into functional design.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#projects"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="px-8 py-3 border border-white/20 hover:border-white/60 hover:bg-white/5 text-white font-medium rounded-lg transition-all duration-300"
          >
            Get In Touch
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;