/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { gsap, useGSAP } from "../lib/gsap";
import EngineeringJourneyScene from "./EngineeringJourneyScene";
import Reveal from "./Reveal";

function MilestoneInfo({
  active,
  id,
  index,
  item,
  selected,
  setHoveredIndex,
  setSelectedIndex,
}) {
  return (
    <article
      id={id}
      data-journey-info
      data-journey-index={index}
      className={`min-w-0 border-l pl-5 transition-colors duration-500 md:pl-7 ${
        active ? "border-cyan-200/65" : "border-cyan-200/20"
      }`}
      onPointerEnter={() => setHoveredIndex(index)}
      onPointerLeave={() =>
        setHoveredIndex((current) => (current === index ? null : current))
      }
      onFocus={() => setHoveredIndex(index)}
      onBlur={() =>
        setHoveredIndex((current) => (current === index ? null : current))
      }
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          data-journey-node
          data-journey-index={index}
          aria-label={`Highlight milestone ${index + 1}: ${item.date}, ${item.title}, ${item.job}`}
          aria-pressed={selected}
          onClick={() =>
            setSelectedIndex((current) => (current === index ? null : index))
          }
          className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold tracking-wider text-cyan-100 transition-[border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${
            active
              ? "border-cyan-100/80 shadow-[0_0_14px_rgba(103,232,249,0.28)]"
              : "border-cyan-300/35"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </button>

        <div className="min-w-0 flex-1">
          <header className="mb-4 space-y-2">
            <h3 className="text-2xl font-bold text-neutral-300 md:text-4xl">
              {item.date}
            </h3>
            <h4 className="break-words text-2xl font-bold text-neutral-400 md:text-3xl">
              {item.title}
            </h4>
            <h4 className="break-words text-2xl font-bold text-neutral-300 md:text-3xl md:text-neutral-500">
              {item.job}
            </h4>
          </header>
          <div>
            {item.contents.map((content, contentIndex) => (
              <p
                className="mb-3 font-normal text-neutral-400"
                key={`${index}-${contentIndex}`}
              >
                {content}
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export const Timeline = ({ data }) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const progressRef = useRef({ value: 0 });
  const entryRef = useRef({ value: 0 });
  const highlightedRef = useRef(null);
  const [sceneActive, setSceneActive] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const highlightedIndex = hoveredIndex ?? selectedIndex;
  highlightedRef.current = highlightedIndex;

  useGSAP(
    (_, contextSafe) => {
      const root = containerRef.current;
      if (!root) return;

      const info = gsap.utils.toArray("[data-journey-info]", root);
      const paragraphs = info.flatMap((block) =>
        [...block.querySelectorAll("p")]
      );
      progressRef.current.value = shouldReduceMotion ? 0.5 : 0;
      entryRef.current.value = shouldReduceMotion ? 1 : 0;

      if (shouldReduceMotion) {
        gsap.set([...info, ...paragraphs], { autoAlpha: 1, y: 0 });
        setSceneActive(false);
        return;
      }

      gsap.set(info, { autoAlpha: 0, y: 20 });
      gsap.set(paragraphs, { autoAlpha: 0, y: 8 });

      const entrance = gsap.timeline({ paused: true });
      entrance.to(
        entryRef.current,
        { value: 1, duration: 1.5, ease: "power2.inOut" },
        0
      );

      let hasEntered = false;
      const enterScene = contextSafe(() => {
        setSceneActive(true);
        if (!hasEntered) {
          hasEntered = true;
          entrance.play(0);
        }
      });
      const leaveScene = contextSafe(() => setSceneActive(false));
      const journey = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 82%",
          end: "bottom 18%",
          scrub: 0.55,
          onEnter: enterScene,
          onEnterBack: enterScene,
          onLeave: leaveScene,
          onLeaveBack: leaveScene,
        },
      });

      journey.to(progressRef.current, {
        value: 1,
        duration: 1,
        ease: "none",
      });

      data.forEach((_, index) => {
        const block = info.find(
          (element) => Number(element.dataset.journeyIndex) === index
        );
        if (!block) return;

        const blockParagraphs = [...block.querySelectorAll("p")];
        const start =
          data.length > 1 ? 0.12 + (index / (data.length - 1)) * 0.46 : 0.18;
        journey.fromTo(
          block,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.18,
            ease: "power2.out",
            immediateRender: false,
          },
          start
        );
        journey.fromTo(
          blockParagraphs,
          { autoAlpha: 0, y: 8 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.14,
            stagger: 0.025,
            ease: "power2.out",
            immediateRender: false,
          },
          start + 0.04
        );
      });
    },
    {
      scope: containerRef,
      dependencies: [data.length, shouldReduceMotion],
      revertOnUpdate: true,
    }
  );

  return (
    <div className="c-space section-spacing" ref={containerRef}>
      <Reveal as="h2" className="text-heading">
        My Engineering Journey
      </Reveal>

      <div
        className="relative mt-8 h-[17rem] overflow-hidden sm:h-[19rem] md:mt-10 md:h-[25rem]"
        data-journey-stage
      >
        <EngineeringJourneyScene
          active={sceneActive}
          entryRef={entryRef}
          highlightedRef={highlightedRef}
          milestoneCount={data.length}
          progressRef={progressRef}
          reducedMotion={shouldReduceMotion}
        />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-8">
        {data.map((item, index) => {
          const selected = selectedIndex === index;
          const active = highlightedIndex === index || selected;

          return (
            <MilestoneInfo
              key={`${item.date}-${item.title}`}
              active={active}
              id={`journey-milestone-${index}`}
              index={index}
              item={item}
              selected={selected}
              setHoveredIndex={setHoveredIndex}
              setSelectedIndex={setSelectedIndex}
            />
          );
        })}
      </div>
    </div>
  );
};
