import { useMemo } from "react";

/* ============================================================
   ENGINEERING SOFTWARE & TOOLS — categorised software showcase
   Replaces the old rotating logo wheel with a calm, premium,
   dashboard-style grid: logo plate on top, name below.
   ============================================================ */

const CATALOG = [
  {
    category: "CAD & DESIGN",
    items: [
      { name: "SOLIDWORKS", icon: "soildworkslogo.svg" },
      { name: "CATIA", icon: "catialogo.svg" },
      { name: "Solid Edge", icon: "soildedge.svg" },
      { name: "Fusion 360", icon: "fusion.svg" },
      { name: "Siemens NX", icon: "Siemens-NX.svg" },
      { name: "AutoCAD", icon: "autocad.svg" },
      { name: "Creo", icon: "creo.svg" },
      { name: "FreeCAD", icon: "FreeCAD.svg" },
      { name: "Onshape", icon: "onshape.svg" },
    ],
  },
  {
    category: "SIMULATION & ANALYSIS",
    items: [
      { name: "ANSYS Fluent", icon: "ansys.svg" },
      { name: "ANSYS Static Structural", icon: "ansys.svg" },
      { name: "MATLAB", icon: "Matlab.svg" },
    ],
  },
  {
    category: "DEVELOPMENT & TECHNOLOGY",
    items: [
      { name: "Python", icon: "Python-logo.svg" },
      { name: "React", icon: "react.svg" },
      { name: "Three.js", icon: "threedotjs.svg" },
    ],
  },
];

/* One software mini-card: light plate holds the logo at a consistent
   visual size, the name sits below. CSS-only hover, no movement. */
function SoftwareCard({ name, icon }) {
  return (
    <div
      className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.07] bg-black/25 px-1.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/50 hover:bg-sky-400/[0.07] hover:shadow-[0_0_16px_rgba(56,189,248,0.15)]"
      title={name}
    >
      {/* light logo plate keeps every brand mark readable & consistent */}
      <span className="grid h-8 w-full shrink-0 place-items-center overflow-hidden rounded-md bg-white/95 p-1 sm:h-9">
        <img
          src={`/assets/logos/${icon}`}
          alt={`${name} logo`}
          loading="lazy"
          className="h-full w-auto max-w-full object-contain"
        />
      </span>
      {/* min-height keeps short names aligned with wrapping ones */}
      <span className="min-h-[1.4rem] text-center text-[9.5px] font-semibold leading-[1.15] tracking-wide text-neutral-200 sm:min-h-[1.55rem] sm:text-[10px]">
        {name}
      </span>
    </div>
  );
}

const EngineeringSoftware = () => {
  const sections = useMemo(() => CATALOG, []);

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      {sections.map((section, s) => (
        <section
          key={section.category}
          className={s > 0 ? "mt-3.5 border-t border-white/[0.06] pt-3" : ""}
        >
          <p className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.22em] text-sky-300/90 sm:text-[10px]">
            <span className="h-1 w-1 rounded-full bg-sky-400/80" aria-hidden />
            {section.category}
            <span
              className="h-px flex-1 bg-gradient-to-r from-sky-400/25 to-transparent"
              aria-hidden
            />
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {section.items.map((item) => (
              <SoftwareCard key={item.name} {...item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default EngineeringSoftware;
