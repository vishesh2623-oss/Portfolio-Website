/* eslint-disable react/prop-types */
import { useState } from "react";
import { useReducedMotion } from "motion/react";
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
      className={`engineering-journey__milestone min-w-0 border-l pl-5 transition-colors duration-500 md:pl-7 ${
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
          <span className="engineering-journey__eyebrow">
            JOURNEY {String(index + 1).padStart(2, "0")}
          </span>
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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const highlightedIndex = hoveredIndex ?? selectedIndex;

  return (
    <div className="c-space section-spacing" id="engineering-journey">
      <Reveal as="h2" className="text-heading">
        My Engineering Journey
      </Reveal>

      <div className="engineering-journey__layout" data-journey-layout>
        <EngineeringJourneyScene reducedMotion={shouldReduceMotion} />
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
