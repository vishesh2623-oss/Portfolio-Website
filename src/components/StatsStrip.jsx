import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";

const statistics = [
  { label: "3D Models", value: 50 },
  { label: "Hackathons", value: 6 },
  { label: "Projects", value: 3 },
];

const StatsStrip = () => {
  const stripRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useGSAP((_, contextSafe) => {
    if (shouldReduceMotion) return;

    const counters = gsap.utils.toArray(
      "[data-stat-value]",
      stripRef.current
    );

    ScrollTrigger.create({
      trigger: stripRef.current,
      start: "top 85%",
      once: true,
      onEnter: contextSafe(() => {
        gsap.from(stripRef.current, {
          opacity: 0.75,
          y: 12,
          duration: 0.65,
          ease: "power2.out",
          overwrite: true,
          clearProps: "opacity,transform",
        });

        counters.forEach((counter, index) => {
          const count = { value: 0 };
          const target = Number(counter.dataset.statValue);
          counter.textContent = "0";

          gsap.to(count, {
            value: target,
            duration: 1.5,
            delay: index * 0.1,
            ease: "power2.out",
            onUpdate: () => {
              counter.textContent = String(Math.round(count.value));
            },
          });
        });
      }),
    });
  }, {
    scope: stripRef,
    dependencies: [shouldReduceMotion],
    revertOnUpdate: true,
  });

  return (
    <section
      ref={stripRef}
      aria-label="Portfolio statistics"
      className="mx-4 mt-8 border-y border-white/10"
    >
      <div className="grid grid-cols-3 divide-x divide-white/10">
        {statistics.map(({ label, value }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col items-center justify-center py-6 text-center sm:py-8"
          >
            <p className="text-3xl font-bold leading-none tabular-nums text-white sm:text-4xl md:text-5xl">
              <span data-stat-value={value}>{value}</span>
              <span aria-hidden="true">+</span>
            </p>
            <p className="mt-2 text-xs uppercase text-neutral-400 sm:text-sm">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsStrip;
