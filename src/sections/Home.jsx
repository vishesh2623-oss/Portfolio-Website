import React, { useState, useEffect } from "react";

const mainWords = ["Innovative", "Analytical", "Driven"];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Matches the exact speed and blur-transition timing from the video
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false); // Trigger blur out & scale up
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % mainWords.length);
        setIsVisible(true); // Trigger un-blur & scale back into focus
      }, 400); // 400ms blur transition duration
    }, 2200); // 2.2s display per word

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#030712] px-6 md:px-16 py-12">
      {/* Subtle glowing ambient background accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Two-Column Layout Grid */}
      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Hero Content */}
        <div className="flex flex-col items-start text-left space-y-6">
          
          {/* Main Name Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Hi, I'm <span className="text-blue-400 drop-shadow-[0_0_25px_rgba(96,165,250,0.4)]">Vishesh R S</span>
          </h1>

          {/* Video-style 3-Tier Animated Text Block */}
          <div className="flex flex-col items-start space-y-1 select-none py-2">
            {/* Top Label (Matches video top text: "3D CAD Designer") */}
            <span className="text-lg sm:text-2xl font-medium text-gray-300 tracking-wide">
              Mechanical & CAD Specialist
            </span>

            {/* Main Animated Word with Blur + Scale Effect (Matches video: "Simulate" / "Code" / "Design") */}
            <div className="h-16 sm:h-20 flex items-center overflow-hidden">
              <span
                className={`text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-none transition-all duration-400 ease-in-out ${
                  isVisible
                    ? "opacity-100 blur-0 scale-100"
                    : "opacity-0 blur-md scale-105"
                }`}
              >
                {mainWords[index]}
              </span>
            </div>

            {/* Bottom Subtitle (Matches video bottom text: "Design Mechanics") */}
            <span className="text-lg sm:text-2xl font-medium text-gray-300 tracking-wide">
              Transforming theoretical physics into functional design
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-4 items-center">
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

        {/* Right Side: Seamless Background-Merged ASCII Photo */}
        <div className="w-full h-[400px] sm:h-[480px] lg:h-[520px] relative flex items-center justify-center">
          <img
            src="/assets/projects/imgascii.png"
            alt="Vishesh R S ASCII Art"
            className="w-full h-full object-contain mix-blend-screen brightness-125 contrast-200 hover:scale-105 transition-transform duration-500"
            style={{
              maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 85%)',
              WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 85%)'
            }}
          />
        </div>

      </div>
    </div>
  );
};

export default Home;