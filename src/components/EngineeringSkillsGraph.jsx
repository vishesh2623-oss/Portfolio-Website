import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";

const skillGroups = [
  {
    id: "software-tools",
    number: "01",
    title: "SOFTWARE & TOOLS",
    skills: [
      { name: "SOLIDWORKS", proficiency: 70 },
      { name: "CATIA", proficiency: 3 },
      { name: "Solid Edge", proficiency: 75 },
      { name: "Fusion 360", proficiency: 10 },
      { name: "ANSYS Fluent", proficiency: 10 },
      { name: "ANSYS Static Structural", proficiency: 2 },
      { name: "React", proficiency: 20 },
      { name: "Three.js", proficiency: 15 },
      { name: "Python", proficiency: 40 },
    ],
  },
  {
    id: "engineering-skills",
    number: "02",
    title: "ENGINEERING SKILLS",
    skills: [
      { name: "3D CAD Modelling", proficiency: 50 },
      { name: "Parametric Modelling", proficiency: 0 },
      { name: "Product Design", proficiency: 10 },
      { name: "Assembly Design", proficiency: 30 },
      { name: "Embedded Systems", proficiency: 50 },
      { name: "Prototype Development", proficiency: 50 },
    ],
  },
];

const headingClasses =
  "text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]";

const groupTitleClasses =
  "bg-gradient-to-r from-green-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent";

const EngineeringSkillsGraph = () => {
  const sectionRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useGSAP((_, contextSafe) => {
    const fills = gsap.utils.toArray(
      "[data-skill-fill][data-proficiency]",
      sectionRef.current
    );

    if (!fills.length) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 85%",
      once: true,
      onEnter: contextSafe(() => {
        fills.forEach((fill, index) => {
          if (shouldReduceMotion) {
            gsap.set(fill, { scaleX: 1 });
            return;
          }

          gsap.fromTo(
            fill,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.9,
              delay: index * 0.07,
              ease: "power2.out",
              overwrite: true,
            }
          );
        });
      }),
    });
  }, {
    scope: sectionRef,
    dependencies: [shouldReduceMotion],
    revertOnUpdate: true,
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="engineering-skills-heading"
      className="mt-14"
    >
      <h2
        id="engineering-skills-heading"
        className={`${headingClasses} mb-10 text-center`}
      >
        ENGINEERING SKILLS &amp; SOFTWARE
      </h2>

      <div className="grid gap-10 md:grid-cols-2 md:gap-8">
        {skillGroups.map((group) => (
          <div key={group.id} className="min-w-0">
            <h3 className="mb-6 flex items-center gap-3 border-b border-white/10 pb-3 text-lg leading-none font-extrabold tracking-tight">
              <span className="text-green-400">{group.number}</span>
              <span className={groupTitleClasses}>{group.title}</span>
            </h3>

            <ul className="space-y-5">
              {group.skills.map(({ name, proficiency }) => (
                <li key={name}>
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-neutral-200">
                    {name}
                    {proficiency !== null && (
                      <span className="shrink-0 text-xs tabular-nums text-neutral-400">
                        {proficiency}%
                      </span>
                    )}
                  </span>
                  <span
                    className="block h-2 overflow-hidden rounded-full bg-white/10"
                    aria-hidden="true"
                  >
                    <span
                      data-skill-fill
                      data-proficiency={proficiency ?? undefined}
                      className="block h-full origin-left rounded-full bg-green-400"
                      style={{
                        width: proficiency === null ? "0%" : `${proficiency}%`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EngineeringSkillsGraph;
