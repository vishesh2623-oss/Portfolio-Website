import React from "react";
// Import your image directly at the top:
import asciiPhoto from "../assets/my_ascii.jpg"; // Adjust path to where your file is saved

const Hero = () => {
  return (
    <section className="relative w-full min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6 md:px-16 overflow-hidden">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-12">
        
        {/* Left Side */}
        <div className="flex flex-col items-start justify-center space-y-6 z-10">
          <span className="px-3 py-1 text-xs uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
            CAD / Simulation Specialist
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-neutral-100">
            Hi, I'm <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Vishesh R S</span>
          </h1>
          
          <p className="text-neutral-400 text-base md:text-lg max-w-lg leading-relaxed">
            Mechanical Engineering Student & CAD / Simulation Specialist. Transforming theoretical physics into functional design.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#projects"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="px-6 py-3 rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-semibold text-sm transition-all duration-300 bg-neutral-900/50"
            >
              Get In Touch
            </a>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full h-[400px] md:h-[500px] lg:h-[550px] relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/40 shadow-2xl flex items-center justify-center p-4">
          <img
            src="assest/projects/ascii.png" // Use the imported image here
            alt="Vishesh R S ASCII Art"
            className="w-full h-full object-cover rounded-xl border border-neutral-800 shadow-lg hover:scale-105 transition-transform duration-500"
          />
        </div>

      </div>
    </section>
  );
};

export default Hero;