/* eslint-disable react/prop-types */
import Reveal from "./Reveal";

const Project = ({
  project,
  onSelect,
  setPreview,
  revealDelay = 0,
}) => {
  const { title, tags, image } = project;

  return (
    <>
      <Reveal
        as="button"
        type="button"
        className="flex flex-wrap items-center justify-between w-full py-10 text-left cursor-pointer space-y-6 sm:space-y-0"
        delay={revealDelay}
        whileHover={{ y: -3 }}
        onClick={onSelect}
        onMouseEnter={() => setPreview(image)}
        onMouseLeave={() => setPreview(null)}
      >
        <div>
          <p className="text-2xl">{title.trim()}</p>
          <div className="flex gap-5 mt-2 text-sand">
            {tags.map((tag) => (
              <span key={tag.id}>{tag.name}</span>
            ))}
          </div>
        </div>
        <span className="flex items-center gap-1 hover-animation">
          Read More
          <img src="assets/arrow-right.svg" className="w-5" />
        </span>
      </Reveal>
      <Reveal className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-[1px] w-full" delay={revealDelay} y={0} />
    </>
  );
};
export default Project;
