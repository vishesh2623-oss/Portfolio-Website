import { useState } from "react";

import ProjectDetails from "./ProjectDetails";
import Reveal from "./Reveal";



const Project = ({

  title,

  description,

  subDescription,

  href,

  cadHref,

  image,

  tags,

  setPreview,
  revealDelay = 0,
}) => {

  const [isHidden, setIsHidden] = useState(false);

  return (

    <>

      <Reveal
        className="flex-wrap items-center justify-between py-10 space-y-14 sm:flex sm:space-y-0"
        delay={revealDelay}
        whileHover={{ y: -3 }}
        onMouseEnter={() => setPreview(image)}
        onMouseLeave={() => setPreview(null)}
      >

        <div>

          <p className="text-2xl">{title}</p>

          <div className="flex gap-5 mt-2 text-sand">

            {tags.map((tag) => (

              <span key={tag.id}>{tag.name}</span>

            ))}

          </div>

        </div>

        <button

          onClick={() => setIsHidden(true)}

          className="flex items-center gap-1 cursor-pointer hover-animation"

        >

          Read More

          <img src="assets/arrow-right.svg" className="w-5" />

        </button>

      </Reveal>

      <Reveal className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-[1px] w-full" delay={revealDelay} y={0} />

      {isHidden && (

        <ProjectDetails

          title={title}

          description={description}

          subDescription={subDescription}

          image={image}

          tags={tags}

          href={href}

          cadHref={cadHref}

          closeModal={() => setIsHidden(false)}

        />

      )}

    </>

  );

};



export default Project; 
