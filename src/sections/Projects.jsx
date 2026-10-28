import { useState } from "react";
import Project from "../components/Project";
import { myProjects } from "../constants";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Reveal from "../components/Reveal";
const Projects = () => {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 10, stiffness: 50 });
  const springY = useSpring(y, { damping: 10, stiffness: 50 });
  const handleMouseMove = (e) => {
    x.set(e.clientX + 20);
    y.set(e.clientY + 20);
  };
  const [preview, setPreview] = useState(null);
  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative c-space section-spacing"
    >
      <Reveal as="h2" className="text-heading">My projects</Reveal>
      <div className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent mt-12 h-[1px] w-full" />
      {myProjects.slice(0, 3).map((project, index) => (
        <Project key={project.id} {...project} setPreview={setPreview} revealDelay={index * 0.08} />
      ))}
      <Reveal as="h2" className="text-heading mt-16">Solidworks Models</Reveal>
      <div className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent mt-12 h-[1px] w-full" />
      {myProjects.slice(3).map((project, index) => (
        <Project key={project.id} {...project} setPreview={setPreview} revealDelay={Math.min(index * 0.06, 0.3)} />
      ))}
      {preview && (
        <motion.img
          className="fixed top-0 left-0 z-50 object-cover h-56 rounded-lg shadow-lg pointer-events-none w-80"
          src={preview}
          style={{ x: springX, y: springY }}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        />
      )}
    </section>
  );
};

export default Projects;
