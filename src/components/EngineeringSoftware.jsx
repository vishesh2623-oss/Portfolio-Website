import { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   ENGINEERING SOFTWARE & TOOLS — full-width orbital showcase
   Three slow, counter-rotating orbits around a minimal hub:
     inner  → CAD & Design · middle → Simulation & Analysis
     outer  → Development & Technology
   All radii are measured from the actual stage box so chips never
   collide or clip the tile at any viewport (320 → desktop).
   ============================================================ */

/* --- Software catalogue (existing portfolio entries only) --- */
const CATALOG = [
  {
    id: "cad",
    label: "CAD & DESIGN",
    color: "#38bdf8",
    duration: 52,
    direction: "normal",
    items: [
      { name: "SOLIDWORKS", tip: "3D CAD Modelling", icon: "soildworkslogo.svg" },
      { name: "CATIA", tip: "Mechanical Design", icon: "catialogo.svg" },
      { name: "Solid Edge", tip: "Parametric 3D Design", icon: "soildedge.svg" },
      { name: "Fusion 360", tip: "Product Design and Modelling", icon: "fusion.svg" },
      { name: "Siemens NX", tip: "Integrated CAD/CAM/CAE", icon: "Siemens-NX.svg" },
      { name: "AutoCAD", tip: "2D Drafting & 3D Design", icon: "autocad.svg" },
      { name: "Creo", tip: "Parametric Modelling", icon: "creo.svg" },
      { name: "FreeCAD", tip: "Open-source Parametric CAD", icon: "FreeCAD.svg" },
      { name: "Onshape", tip: "Cloud-native 3D CAD", icon: "onshape.svg" },
    ],
  },
  {
    id: "sim",
    label: "SIMULATION & ANALYSIS",
    color: "#a78bfa",
    duration: 68,
    direction: "reverse",
    items: [
      { name: "ANSYS Fluent", tip: "Computational Fluid Dynamics", icon: "ansys.svg" },
      { name: "ANSYS Static Structural", tip: "Structural Analysis", icon: "ansys.svg" },
      { name: "MATLAB", tip: "Numerical Computing", icon: "Matlab.svg" },
    ],
  },
  {
    id: "dev",
    label: "DEVELOPMENT & TECHNOLOGY",
    color: "#22d3ee",
    duration: 84,
    direction: "normal",
    items: [
      { name: "Python", tip: "Programming & Automation", icon: "Python-logo.svg" },
      { name: "React", tip: "Frontend Development", icon: "react.svg" },
      { name: "Three.js", tip: "Interactive 3D Visualisation", icon: "threedotjs.svg" },
    ],
  },
];

/* --- geometry: outcome-safe radii computed from the measured stage --- */
function computeOrbits(stage, showLabels) {
  const half = stage / 2;
  const compact = stage < 360;

  const chip = compact ? 28 : stage < 560 ? 36 : stage < 700 ? 42 : 46;
  const ringGap = compact ? 9 : 16;
  const arcGap = compact ? 4 : 8;
  /* reserve room below outer chips for name labels (desktop only) */
  const labelRoom = showLabels ? 18 : 8;

  /* inner ring: arc spacing between the 9 CAD chips must fit chip+gap */
  const r1 = ((chip + arcGap) * 9) / (Math.PI * 2);
  const r2 = r1 + chip + ringGap;
  const r3 = r2 + chip + ringGap;

  /* if the outer ring + labels don't fit the stage, compress proportionally */
  const maxReach = half - chip / 2 - labelRoom;
  const compress = Math.min(1, maxReach / r3);

  return {
    chip,
    hub: Math.max(44, Math.round((r1 - chip / 2 - 10) * 2)),
    radii: [r1, r2, r3].map((r) => Math.round(r * compress)),
  };
}

/* --- one orbital ring: path circle + counter-rotating chips --- */
function OrbitRing({ orbit, radius, chip, showLabels, active, onHoverIn, onHoverOut, onToggle }) {
  const n = orbit.items.length;
  const offset = -90; /* first node starts at 12 o'clock */
  const ringAlpha = Math.round(0.16 * 255)
    .toString(16)
    .padStart(2, "0");

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* thin illuminated path */}
      <div
        className="orbit-ring"
        style={{
          width: radius * 2,
          height: radius * 2,
          borderColor: `${orbit.color}${ringAlpha}`,
        }}
        aria-hidden
      />

      {/* rotating layer — flex centering anchors abs children at the centre */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* travelling glow dot, slightly offset from the chips */}
        <span
          className="orbit-dot"
          aria-hidden
          style={{
            backgroundColor: orbit.color,
            boxShadow: `0 0 8px ${orbit.color}`,
            animation: `orbit ${orbit.duration}s linear infinite ${orbit.direction}`,
            animationDelay: `-${orbit.duration / 2.4}s`,
            "--angle": 0,
            "--radius": radius,
          }}
        />
        {orbit.items.map((item, i) => {
          const entry = { name: item.name, tip: item.tip, category: orbit.label };
          return (
            <SoftwareChip
              key={item.name}
              item={item}
              angle={offset + (360 / n) * i}
              radius={radius}
              chip={chip}
              duration={orbit.duration}
              direction={orbit.direction}
              entry={entry}
              /* labels only where ring spacing allows them (no collisions) */
              showLabel={showLabels && n <= 5}
              active={active?.name === item.name}
              onHoverIn={onHoverIn}
              onHoverOut={onHoverOut}
              onToggle={onToggle}
            />
          );
        })}
      </div>
    </div>
  );
}

function SoftwareChip({
  item,
  angle,
  radius,
  chip,
  duration,
  direction,
  entry,
  showLabel,
  active,
  onHoverIn,
  onHoverOut,
  onToggle,
}) {
  return (
    <button
      type="button"
      className={`software-node ${active ? "is-active" : ""}`}
      style={{
        width: chip,
        height: chip,
        "--angle": angle,
        "--radius": radius,
        animation: `orbit ${duration}s linear infinite ${direction}`,
      }}
      onMouseEnter={() => onHoverIn(entry)}
      onMouseLeave={onHoverOut}
      onFocus={() => onHoverIn(entry)}
      onBlur={onHoverOut}
      onClick={() => onToggle(entry)}
      aria-label={`${item.name} — ${item.tip} (${entry.category})`}
    >
      <span className="software-plate">
        <img src={`/assets/logos/${item.icon}`} alt={item.name} loading="lazy" />
      </span>
      {/* name under the chip — only on spacious rings, hidden on small phones */}
      <span
        className={`software-label absolute left-1/2 top-[calc(100%+5px)] w-max max-w-24 -translate-x-1/2 text-center text-[8.5px] font-semibold uppercase leading-[1.2] tracking-[0.1em] text-neutral-300/85 ${
          showLabel ? "" : "opacity-0"
        }`}
      >
        {item.name}
      </span>
    </button>
  );
}

/* --- minimal metallic hub: tick ring, cross markings, breathing core --- */
function CenterHub({ size }) {
  const ticks = 24;
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* ambient glow behind the hub */}
      <div
        className="absolute -inset-6 rounded-full opacity-60"
        style={{
          background: `radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 68%)`,
          filter: "blur(6px)",
        }}
      />
      {/* outer thin frame */}
      <div className="absolute inset-0 rounded-full border border-white/15" />
      {/* rotating tick ring (very slow) */}
      <div
        className="hub-tick-ring absolute inset-[7%] rounded-full"
        style={{
          background: `repeating-conic-gradient(
            rgba(56,189,248,0.55) 0deg 1.5deg,
            transparent 1.5deg ${360 / ticks}deg)`,
          WebkitMask: "radial-gradient(circle, transparent 62%, black 64%, black 86%, transparent 88%)",
          mask: "radial-gradient(circle, transparent 62%, black 64%, black 86%, transparent 88%)",
          opacity: 0.5,
        }}
      />
      {/* metallic core */}
      <div
        className="absolute inset-[18%] rounded-full border border-white/20"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #4b5668 0%, #2b3342 42%, #121826 100%)",
          boxShadow: "inset 0 2px 6px rgba(255,255,255,0.14), inset 0 -4px 10px rgba(0,0,0,0.55)",
        }}
      />
      {/* geometric mark: rotated square + glowing centre */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="h-[38%] w-[38%] rotate-45 rounded-[3px] border border-sky-300/50"
          style={{ boxShadow: "0 0 8px rgba(56,189,248,0.25), inset 0 0 6px rgba(56,189,248,0.15)" }}
        />
        <span
          className="hub-dot absolute h-[9%] w-[9%] rounded-full bg-sky-300"
          style={{ boxShadow: "0 0 10px rgba(56,189,248,0.9)" }}
        />
      </div>
    </div>
  );
}

/* --- HUD readout: hover / tap target information (never clipped) --- */
function Readout({ active }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md">
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-sky-300/80">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            active ? "bg-sky-400" : "bg-neutral-500"
          }`}
          style={active ? { boxShadow: "0 0 8px #38bdf8" } : undefined}
        />
        System Readout
      </p>
      {active ? (
        <p className="mt-1.5 leading-snug">
          <span className="text-sm font-bold text-white">{active.name}</span>
          <span className="ml-2 text-xs font-semibold text-sky-300/90">
            – {active.tip}
          </span>
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">
            {active.category}
          </span>
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-neutral-400">
          <span className="hidden sm:inline">Hover</span>
          <span className="sm:hidden">Tap</span>{" "}
          a node on the orbits to inspect the software.
        </p>
      )}
    </div>
  );
}

/* --- title / description (stationary) --- */
function InfoPanel({ active }) {
  return (
    <div className="relative z-10 md:flex md:h-full md:w-[19rem] md:shrink-0 md:flex-col xl:w-[21rem]">
      <div>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-sky-300/80">
          {"// Software Ecosystem"}
        </p>
        <h3 className="mt-2 text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:text-[1.65rem] lg:text-[1.8rem]">
          Engineering
          <br />
          Software &amp; Tools
        </h3>
        <p className="subtext mt-2.5 max-w-[30rem] text-[13.5px] lg:max-w-none">
          I specialize in 3D CAD modeling and physical simulations using
          SolidWorks, Fusion 360 and Solid Edge.
        </p>

        {/* category legend */}
        <div className="mt-4 hidden gap-x-4 gap-y-2 sm:grid sm:grid-cols-3 md:grid-cols-1 md:gap-2">
          {CATALOG.map((o) => (
            <p
              key={o.id}
              className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-neutral-300"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: o.color, boxShadow: `0 0 8px ${o.color}80` }}
              />
              {o.label}{" "}
              <span className="text-neutral-500">· {o.items.length}</span>
            </p>
          ))}
        </div>
      </div>

      {/* readout lives in the side panel from md up */}
      <div className="mt-4 hidden md:block md:mt-auto md:pb-1">
        <Readout active={active} />
      </div>
    </div>
  );
}

/* ============================================================ */

const EngineeringSoftware = () => {
  const stageRef = useRef(null);
  const [stage, setStage] = useState(0);
  const [active, setActive] = useState(null);

  /* measure the orbit stage once + on resize (existing codebase pattern) */
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStage(Math.min(rect.width, rect.height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const showLabels = stage >= 420;
  const orbits = useMemo(
    () => (stage > 0 ? computeOrbits(stage, showLabels) : null),
    [stage, showLabels]
  );

  /* hover/focus handlers receive the payload directly */
  const hoverIn = (entry) => setActive(entry);
  const hoverOut = () => setActive(null);
  const toggle = (entry) => setActive((cur) => (cur?.name === entry.name ? null : entry));

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-col gap-5 md:mx-auto md:w-full md:max-w-[78rem] md:flex-row md:items-stretch md:gap-6">
      <InfoPanel active={active} />

      {/* orbit stage */}
      <div className="relative flex min-h-[19rem] flex-1 items-center justify-center">
        <div
          ref={stageRef}
          className="relative aspect-square w-full max-w-[26rem] md:aspect-auto md:h-full md:max-w-none"
        >
          {orbits && (
            <>
              {/* ambient glow beneath the whole system */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[-10%] opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.07) 0%, transparent 60%)",
                }}
              />
              <CenterHub size={orbits.hub} />
              {CATALOG.map((o, idx) => (
                <OrbitRing
                  key={o.id}
                  orbit={o}
                  radius={orbits.radii[idx]}
                  chip={orbits.chip}
                  showLabels={showLabels}
                  active={active}
                  onHoverIn={hoverIn}
                  onHoverOut={hoverOut}
                  onToggle={toggle}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* mobile: readout sits under the orbits so it never blocks them */}
      <div className="md:hidden">
        <Readout active={active} />
      </div>
    </div>
  );
};

export default EngineeringSoftware;
