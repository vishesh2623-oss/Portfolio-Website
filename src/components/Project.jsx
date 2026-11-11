/* eslint-disable react/prop-types */
import { motion } from "motion/react";
import Reveal from "./Reveal";

const Project = ({ project, onSelect, setPreview, revealDelay = 0 }) => {
  const { title, image, tags = [] } = project;

  return (
    <>
      <motion.button
        type="button"
        className="flex flex-wrap items-center justify-between w-full py-10 text-left cursor-pointer space-y-6 sm:space-y-0"
        whileHover={{ y: -3 }}
        onClick={onSelect}
        onMouseEnter={() => setPreview(image)}
        onMouseLeave={() => setPreview(null)}
        aria-label={`View project details for ${title.trim()}`}
      >
        <div className="project-card-content flex flex-wrap items-center justify-between w-full space-y-6 sm:space-y-0">
          <div>
            <p className="text-2xl">{title.trim()}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sand sm:gap-5">
              {tags.map((tag) => (
                <span key={tag.id}>{tag.name}</span>
              ))}
            </div>
          </div>
          <span className="flex items-center gap-1 hover-animation">
            View Details
            <img src="/assets/arrow-right.svg" className="w-5" alt="" />
          </span>
        </div>
      </motion.button>
      <Reveal
        className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-[1px] w-full"
        delay={revealDelay}
        y={0}
      />
    </>
  );
};

export default Project;
