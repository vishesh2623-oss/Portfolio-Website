const Credentials = () => {
  const certificates = [
    "/assets/projects/ai curve.jpg", 
    "/assets/projects/ai data analysis.jpg", 
    "/assets/projects/ai everyone.jpg",
    "/assets/projects/ai responsibly.jpg",
    "/assets/projects/art of prompt.jpg",
    "/assets/projects/google ai intro.jpg",
    "/assets/projects/google ai.jpg",
    "/assets/projects/intro to python.jpg",
    "/assets/projects/max productivity.jpg",
    "/assets/projects/microsoft azure.jpg",
    "/assets/projects/basics python.jpg",
    "/assets/projects/ibm.jpg",
    "/assets/projects/nptel.jpg",
    "/assets/projects/claude.jpg",
  ];

  const achievements = [
    "/assets/projects/psg.jpg",   
    "/assets/projects/ideafest.png",
  ];

  const internships = [
    "/assets/projects/intern.jpg",
  ];

  // Reusable grid layout for the sections
  const ImageGrid = ({ title, images }) => (
    <div className="mb-20">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-10 bg-gradient-to-r from-green-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {images.map((src, index) => (
          <div 
            key={`${title}-${index}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:border-green-500/30 transition-all duration-300"
          >
            <img 
              src={src} 
              alt={`${title} document ${index + 1}`} 
              className="w-full h-auto object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto py-20" id="credentials">
      <ImageGrid title="Certifications" images={certificates} />
      <ImageGrid title="Achievements & Hackathons" images={achievements} />
      <ImageGrid title="Internship Experience" images={internships} />
    </section>
  );
};

export default Credentials;