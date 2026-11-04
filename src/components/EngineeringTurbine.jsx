import { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  ClockEngine, ResponsiveCamera, AutoFramer, Backdrop, Particles,
  DisplayPlatform, cycleState, sim, CYCLE,
} from "./turbine/TurbineKit";
import { EngineAssembly } from "./turbine/GasTurbine";

/* ============================================================
   ENGINEERING THE POSSIBLE — interactive gas-turbine showcase.
   Replaces the old contact CTA tile in the About grid.
   ============================================================ */

const STATUS_STYLE = {
  ASSEMBLED: { txt: "ENGINE SYSTEM · NOMINAL", dot: "#4ade80", rpm: "8,450" },
  EXPLODING: { txt: "TEARDOWN IN PROGRESS", dot: "#60a5fa", rpm: "1,900" },
  "EXPLODED VIEW": { txt: "COMPONENT INSPECTION MODE", dot: "#f472b6", rpm: "0" },
  REASSEMBLING: { txt: "REASSEMBLY SEQUENCE", dot: "#facc15", rpm: "1,900" },
};

/* slow presentation yaw of the whole stage — no mechanical rotation here */
function StageGroup({ children }) {
  const ref = useRef();
  const { size } = useThree();
  const fitScale = THREE.MathUtils.clamp(
    0.5 + (size.width / Math.max(1, size.height)) * 0.4,
    0.62,
    0.9
  );
  useFrame((_, dt) => {
    const { p } = cycleState(sim.time);
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.16 * (1 - 0.85 * p);
  });
  return (
    <group ref={ref} rotation={[0, -0.45, 0]} position={[0, -0.35, 0]} scale={fitScale}>
      {children}
    </group>
  );
}

const EngineeringTurbine = () => {
  const controlsRef = useRef();
  const [paused, setPaused] = useState(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced;
  });
  if (paused) sim.paused = true;
  const [phase, setPhase] = useState("ASSEMBLED");
  const style = STATUS_STYLE[phase] ?? STATUS_STYLE.ASSEMBLED;

  const resume = () => {
    sim.paused = false;
    setPaused(false);
  };
  const togglePause = () => {
    sim.paused = !sim.paused;
    setPaused(sim.paused);
  };
  const explodeNow = () => {
    sim.time = CYCLE.assembled; // start of the teardown phase
    resume();
  };
  const reassembleNow = () => {
    sim.time = CYCLE.assembled + CYCLE.explode; // hold → reassembly begins
    resume();
  };
  const resetView = () => controlsRef.current?.reset();

  const controls = [
    { icon: paused ? "▶" : "❚❚", title: paused ? "Resume animation" : "Pause animation", fn: togglePause },
    { icon: "⤢", title: "Explode assembly", fn: explodeNow },
    { icon: "⤡", title: "Reassemble engine", fn: reassembleNow },
    { icon: "⌖", title: "Reset view", fn: resetView },
  ];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl md:flex-row">
      {/* ============ LEFT: text panel (desktop) / text block (mobile) ============ */}
      <div className="relative z-10 flex shrink-0 flex-col justify-center p-4 sm:p-5 md:w-[38%] md:border-r md:border-white/10 md:px-5 md:py-6 lg:w-[38%]">
        <p className="headtext mt-0 mb-1 text-[clamp(1.3rem,4.2vw,1.6rem)] md:mb-2 md:mt-0 md:text-[clamp(1.05rem,1.7vw,1.35rem)] lg:text-[1.6rem] break-words leading-tight font-semibold tracking-wide">
          ENGINEERING THE POSSIBLE.
        </p>
        <p className="subtext font-semibold text-neutral-200">
          Where turbine architecture meets additive thinking.
        </p>
        <p className="subtext mt-2 text-neutral-400">
          Exploring the intersection of mechanical design, advanced engineering and
          future technologies.
        </p>

        {/* technical HUD labels — relocated into the text column so they never
            sit on top of the compressor / casing geometry */}
        <div className="pointer-events-none mt-4 flex flex-wrap gap-1.5">
          {["TURBINE ASSEMBLY", "ADVANCED MECHANICS", "PRECISION ENGINEERING"].map((t) => (
            <div key={t} className="rounded-sm border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-md">
              <span className="font-mono text-[9px] tracking-[0.18em] text-sky-300/80">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============ RIGHT: 3D turbine canvas ============ */}
      <div className="relative min-h-[13rem] min-w-0 flex-1 md:min-h-0">
        <Canvas
          dpr={[1, typeof window !== "undefined" && window.innerWidth < 640 ? 1.6 : 2]}
          camera={{ position: [9.2, 4.6, 13.6], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          shadows
        >
          <ResponsiveCamera />
          <ClockEngine />
          <AutoFramer />

          <ambientLight intensity={0.45} />
          <directionalLight
            position={[7, 10, 8]} intensity={2.0} color="#fff2e0" castShadow
            shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}
          />
          <directionalLight position={[-8, 3, -7]} intensity={0.75} color="#7fb4ff" />
          <pointLight position={[0, -2.5, 6]} intensity={16} distance={13} color="#38bdf8" />
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2.6} position={[4, 8, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1.3} position={[-8, 4, -6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={1.6} position={[0, -6, 4]} scale={[8, 8, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1.0} position={[0, 3, -10]} scale={[12, 8, 1]} target={[0, 0, 0]} />
          </Environment>

          <Backdrop />
          <DisplayPlatform />
          <Particles />

          <StageGroup>
            <EngineAssembly />
          </StageGroup>

          {/* phase sync for the status chip */}
          <PhaseReporter onPhase={setPhase} />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            enableZoom
            enableDamping
            dampingFactor={0.08}
            minDistance={8}
            maxDistance={34}
            maxPolarAngle={Math.PI * 0.62}
          />
        </Canvas>

        {/* ============ status chip ============ */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex max-w-[70%] items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur-md">
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: style.dot, boxShadow: `0 0 8px ${style.dot}` }}
          />
          <span className="truncate font-mono text-[10px] font-medium tracking-[0.14em] text-neutral-300">
            {style.txt} · N1 {style.rpm} RPM{paused ? " · PAUSED" : ""}
          </span>
        </div>

        {/* ============ control cluster ============ */}
        <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
          {controls.map((c) => (
            <button
              key={c.title}
              type="button"
              title={c.title}
              aria-label={c.title}
              onClick={c.fn}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[11px] leading-none text-neutral-300 backdrop-blur-md transition-colors hover:border-sky-400/50 hover:text-sky-300 focus:outline-none active:scale-95"
            >
              {c.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ============ HUD: corner brackets ============ */}
      {[
        ["top-2 left-2", "border-t border-l"],
        ["top-2 right-2", "border-t border-r"],
        ["bottom-2 left-2", "border-b border-l"],
        ["bottom-2 right-2", "border-b border-r"],
      ].map(([pos, edges]) => (
        <div key={pos} className={`pointer-events-none absolute ${pos} ${edges} h-4 w-4 border-sky-400/25 z-20`} />
      ))}
    </div>
  );
};

/* reports the current phase without re-rendering the tree each frame */
function PhaseReporter({ onPhase }) {
  const last = useRef("");
  useFrame(() => {
    const { phase } = cycleState(sim.time);
    if (phase !== last.current) {
      last.current = phase;
      onPhase?.(phase);
    }
  });
  return null;
}

export default EngineeringTurbine;
