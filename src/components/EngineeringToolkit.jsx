import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { motion } from "motion/react";
import * as THREE from "three";

/* ============================================================
   MY ENGINEERING TOOLKIT
   Precision gear assembly in a futuristic CAD-workspace tile.
   Procedural Three.js model + floating software badges.
   ============================================================ */

const ACCENT = "#38bdf8";

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Badge data ---------- */
const BADGES = [
  {
    name: "SOLIDWORKS",
    tip: "3D CAD Modelling",
    cat: "CAD & DESIGN",
    icon: "assets/logos/soildworkslogo.svg",
    /* desktop slot */
    slot: "md:top-[39%] md:left-2",
    tipBelow: false,
  },
  {
    name: "SOLID EDGE",
    tip: "Parametric 3D Design",
    cat: "CAD & DESIGN",
    icon: "assets/logos/soildedge.svg",
    slot: "md:top-[57%] md:left-2",
    tipBelow: false,
  },
  {
    name: "CATIA",
    tip: "Mechanical Design",
    cat: "CAD & DESIGN",
    icon: "assets/logos/catialogo.svg",
    slot: "md:top-[39%] md:right-2",
    tipBelow: false,
  },
  {
    name: "Fusion 360",
    tip: "Product Design and Modelling",
    cat: "CAD & DESIGN",
    icon: "assets/logos/fusion.svg",
    slot: "md:top-[57%] md:right-2",
    tipBelow: false,
  },
  {
    name: "ANSYS Fluent",
    tip: "Computational Fluid Dynamics",
    cat: "SIMULATION",
    icon: "assets/logos/ansys.svg",
    slot: "md:bottom-[7%] md:left-[29%] md:-translate-x-1/2",
    tipBelow: false,
  },
  {
    name: "ANSYS Static Structural",
    tip: "Structural Analysis",
    cat: "SIMULATION",
    icon: "assets/logos/ansys.svg",
    slot: "md:bottom-[7%] md:left-[71%] md:-translate-x-1/2",
    tipBelow: false,
    wrap: true,
  },
  {
    name: "React",
    tip: "Frontend Development",
    cat: "DEVELOPMENT",
    icon: null,
    slot: "md:top-[22%] md:left-1/2 md:-translate-x-1/2",
    tipBelow: true,
  },
  {
    name: "Three.js",
    tip: "Interactive 3D Visualisation",
    cat: "DEVELOPMENT",
    icon: null,
    slot: "md:top-[36%] md:left-1/2 md:-translate-x-1/2",
    tipBelow: true,
  },
];

const CAT_HEADERS = [
  { label: "CAD & DESIGN", before: "SOLIDWORKS" },
  { label: "SIMULATION", before: "ANSYS Fluent" },
  { label: "DEVELOPMENT", before: "React" },
];

/* ---------- Shared materials (realistic metalwork) ---------- */
const MATS = {
  housing: new THREE.MeshStandardMaterial({ color: "#818a94", metalness: 0.92, roughness: 0.42, envMapIntensity: 0.9 }),
  gunmetal: new THREE.MeshStandardMaterial({ color: "#3c4249", metalness: 0.94, roughness: 0.32, envMapIntensity: 1.0 }),
  steel: new THREE.MeshStandardMaterial({ color: "#bcc3ca", metalness: 1.0, roughness: 0.22, envMapIntensity: 1.25 }),
  gearSteel: new THREE.MeshStandardMaterial({ color: "#aeb6be", metalness: 1.0, roughness: 0.3, envMapIntensity: 1.15 }),
  brass: new THREE.MeshStandardMaterial({ color: "#b3873e", metalness: 1.0, roughness: 0.34, envMapIntensity: 1.05 }),
  bolt: new THREE.MeshStandardMaterial({ color: "#33383d", metalness: 0.92, roughness: 0.35, envMapIntensity: 1.0 }),
  race: new THREE.MeshStandardMaterial({ color: "#d3dae1", metalness: 1.0, roughness: 0.14, envMapIntensity: 1.4 }),
  emissive: new THREE.MeshStandardMaterial({
    color: "#0a1620", emissive: ACCENT, emissiveIntensity: 2.2,
    metalness: 0.4, roughness: 0.4,
  }),
};

/* ---------- Geometry helpers ---------- */
const holePath = (cx, cy, r) => {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, true);
  return p;
};

function makeGearGeometry({ teeth, module: m, width, hubR, ringHoles = 0 }) {
  const pitchR = (teeth * m) / 2;
  const rOuter = pitchR + m;
  const rRoot = pitchR - 1.25 * m;
  const pitch = (2 * Math.PI) / teeth;
  const shape = new THREE.Shape();
  shape.moveTo(Math.cos(-pitch / 2) * rRoot, Math.sin(-pitch / 2) * rRoot);
  const rootHalf = pitch * 0.26;
  const tipHalf = pitch * 0.15;
  for (let i = 0; i < teeth; i++) {
    const c = i * pitch;
    shape.lineTo(Math.cos(c - rootHalf) * rRoot, Math.sin(c - rootHalf) * rRoot);
    shape.lineTo(Math.cos(c - tipHalf) * rOuter, Math.sin(c - tipHalf) * rOuter);
    shape.lineTo(Math.cos(c + tipHalf) * rOuter, Math.sin(c + tipHalf) * rOuter);
    shape.lineTo(Math.cos(c + rootHalf) * rRoot, Math.sin(c + rootHalf) * rRoot);
    shape.absarc(0, 0, rRoot, c + rootHalf, c + pitch - pitch / 2, false);
  }
  shape.holes.push(holePath(0, 0, hubR));
  if (ringHoles) {
    const orbit = (hubR + rRoot) / 2;
    const holeR = (rRoot - hubR) / 2.6;
    for (let i = 0; i < ringHoles; i++) {
      const a = (i / ringHoles) * Math.PI * 2;
      shape.holes.push(holePath(Math.cos(a) * orbit, Math.sin(a) * orbit, holeR));
    }
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width, bevelEnabled: true, bevelThickness: 0.012,
    bevelSize: 0.012, bevelSegments: 1, curveSegments: 6,
  });
  geo.translate(0, 0, -width / 2);
  return geo;
}

function makeRingGeo(rIn, rOut, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  s.holes.push(holePath(0, 0, rIn));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 32 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/* ---------- Cached geometries ---------- */
const NA = 40;   // main gear teeth
const NB = 16;   // pinion teeth
const MODULE = 0.16;
const rA = (NA * MODULE) / 2; // 3.2
const rB = (NB * MODULE) / 2; // 1.28
const PINION_DIST = rA + rB;  // 4.48
const PINION_ANGLE = -(Math.PI / 3); // -60deg

const GEO = {
  mainGear: makeGearGeometry({ teeth: NA, module: MODULE, width: 0.5, hubR: 0.46, ringHoles: 6 }),
  pinion: makeGearGeometry({ teeth: NB, module: MODULE, width: 0.6, hubR: 0.28 }),
  ringPlate: makeRingGeo(3.35, 4.75, 0.5),
  raceOuter: makeRingGeo(0.88, 1.05, 0.3),
  raceInner: makeRingGeo(0.47, 0.66, 0.3),
  holoRing: new THREE.RingGeometry(5.2, 5.26, 96),
  holoArcA: new THREE.RingGeometry(5.42, 5.6, 48, 1, 0, Math.PI / 3),
  holoArcB: new THREE.RingGeometry(5.42, 5.6, 48, 1, Math.PI * 1.1, Math.PI / 3),
};

const HEX_HEAD = new THREE.CylinderGeometry(0.17, 0.17, 0.14, 6);

const GEAR_CROSS = NA / NB; // 2.5 (not integer on purpose, teeth interleave visually)

/* ---------- Procedural gear assembly ---------- */
function GearAssembly() {
  const mainRef = useRef();
  const pinionRef = useRef();

  useFrame((_, dt) => {
    if (reducedMotion) return;
    const step = Math.min(dt, 0.1);
    mainRef.current.rotation.z += step * 0.32;
    pinionRef.current.rotation.z -= step * 0.32 * GEAR_CROSS;
  });

  const px = Math.cos(PINION_ANGLE) * PINION_DIST; // +2.24
  const py = Math.sin(PINION_ANGLE) * PINION_DIST; // -3.88

  return (
    <group>
      {/* ---- back plate ---- */}
      <mesh material={MATS.gunmetal} position={[-0.16, -0.98, -1.35]}>
        <boxGeometry args={[9.8, 9.6, 0.45]} />
      </mesh>
      {/* plate corner screws */}
      {[[-4.06, 3.0], [4.06, 3.0], [-4.06, -4.96], [4.06, -4.96]].map(([x, y], i) => (
        <mesh key={i} geometry={HEX_HEAD} material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]}
          position={[x, y, -1.1]} />
      ))}

      {/* ---- main shaft ---- */}
      <mesh material={MATS.steel} rotation={[Math.PI / 2, 0, 0]} position={[-0.16, -0.98, 0.15]}>
        <cylinderGeometry args={[0.45, 0.45, 3.2, 28]} />
      </mesh>
      {/* shaft collar (front) */}
      <mesh geometry={HEX_HEAD} material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]}
        position={[-0.16, -0.98, 1.55]} scale={3.4} />

      {/* ---- bearing bosses on the back plate ---- */}
      {[-1.15, 0.95].map((z) => (
        <group key={z} position={[-0.16, -0.98, z]}>
          <mesh material={MATS.housing} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.15, 1.15, 0.5, 28]} />
          </mesh>
          <mesh geometry={GEO.raceOuter} material={MATS.race} />
          <mesh geometry={GEO.raceInner} material={MATS.race} />
        </group>
      ))}

      {/* ---- main gear (tooth centred on the pinion direction) ---- */}
      <group ref={mainRef} rotation={[0, 0, PINION_ANGLE]} position={[-0.16, -0.98, 0]}>
        <mesh geometry={GEO.mainGear} material={MATS.gearSteel} />
      </group>

      {/* ---- pinion (gap centred facing the main gear) ---- */}
      <group position={[px - 0.16, py - 0.98, 0]}>
        <group ref={pinionRef} rotation={[0, 0, PINION_ANGLE + Math.PI - Math.PI / NB]}>
          <mesh geometry={GEO.pinion} material={MATS.brass} />
        </group>
        <mesh material={MATS.steel} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.26, 0.26, 1.4, 20]} />
        </mesh>
      </group>

      {/* ---- front ring plate + fasteners + accent ring ---- */}
      <mesh geometry={GEO.ringPlate} material={MATS.housing} position={[-0.16, -0.98, 0.85]} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh key={i} geometry={HEX_HEAD} material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]}
            position={[-0.16 + Math.cos(a) * 4.25, -0.98 + Math.sin(a) * 4.25, 1.14]} />
        );
      })}
      <mesh material={MATS.emissive} position={[-0.16, -0.98, 1.12]}>
        <torusGeometry args={[4.5, 0.025, 8, 64]} />
      </mesh>
    </group>
  );
}

/* ---------- Holographic HUD rings ---------- */
function HudRings() {
  const a = useRef();
  const b = useRef();
  useFrame((_, dt) => {
    if (reducedMotion) return;
    a.current.rotation.z -= dt * 0.3;
    b.current.rotation.z += dt * 0.22;
  });
  const HOLO = {
    glow: new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }),
    dim: new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }),
  };
  return (
    <group position={[0, 0, -1.9]}>
      <mesh geometry={GEO.holoRing} material={HOLO.dim} />
      <group ref={a}>
        <mesh geometry={GEO.holoArcA} material={HOLO.glow} />
      </group>
      <group ref={b}>
        <mesh geometry={GEO.holoArcB} material={HOLO.glow} />
      </group>
    </group>
  );
}

/* ---------- Subtle floating particles ---------- */
function Particles() {
  const { size } = useThree();
  const positions = useMemo(() => {
    const n = size.width < 640 ? 70 : 150;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = -1 - Math.random() * 5;
    }
    return arr;
  }, [size.width]);
  const ref = useRef();
  useFrame((_, dt) => {
    if (reducedMotion) return;
    ref.current.rotation.y += Math.min(dt, 0.1) * 0.03;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={ACCENT} size={0.035} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------- Stage: responsive fit + slow rotation + float ---------- */
function Stage() {
  const fit = useRef();
  const stage = useRef();
  const { size } = useThree();
  const t = useRef(0);

  useEffect(() => {
    const scale = size.width < 500 ? 0.5 : size.width < 700 ? 0.78 : 1;
    const baseY = size.width < 500 ? 1.0 : size.width < 700 ? 0.4 : -0.55;
    fit.current.scale.setScalar(scale);
    fit.current.position.y = baseY;
  }, [size.width]);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    t.current += Math.min(dt, 0.1);
    stage.current.rotation.y = t.current * 0.22;
    stage.current.position.y = Math.sin(t.current * 0.9) * 0.12;
  });

  /* recenter the (off-centre) assembly around its own bounding centre */
  return (
    <group ref={fit}>
      <group ref={stage} position={[-0.16, 0.98, 0]}>
        <GearAssembly />
        <HudRings />
      </group>
      <Particles />
    </group>
  );
}

/* ---------- Lights + responsive camera ---------- */
function Rig() {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 10, 8]} intensity={1.4} color="#fff4e0" />
      <directionalLight position={[-8, -4, -6]} intensity={0.5} color="#7fb4ff" />
      <pointLight position={[2, 3, 7]} intensity={24} distance={20} color={ACCENT} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[4, 8, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} position={[-8, 4, -6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.3} position={[0, -6, 4]} scale={[8, 8, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

/* ---------- Software badge ---------- */
function SoftwareBadge({ badge, index, active, onActivate, reduced }) {
  const [hovered, setHovered] = useState(false);
  const shown = active === index || hovered;

  const toggle = () => onActivate(active === index ? null : index);

  return (
    <motion.div
      className={`pointer-events-auto md:absolute ${badge.slot}`}
      animate={reduced ? undefined : { y: [0, -5, 0] }}
      transition={{
        duration: 5 + (index % 3),
        repeat: Infinity,
        ease: "easeInOut",
        delay: (index % 4) * 0.7,
      }}
    >
      <motion.button
        type="button"
        whileHover={reduced ? undefined : { scale: 1.08 }}
        whileTap={reduced ? undefined : { scale: 0.95 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={toggle}
        aria-label={`${badge.name} — ${badge.tip}`}
        className={`relative flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md cursor-pointer transition-colors duration-200 ${
          shown
            ? "border-sky-400/70 bg-black/60 shadow-[0_0_18px_rgba(56,189,248,0.35)]"
            : "border-white/10 bg-black/35 hover:border-sky-400/70 hover:bg-black/60 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)]"
        }`}
      >
        {badge.icon ? (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/95">
            <img src={badge.icon} alt="" className="h-3.5 w-auto max-w-10 object-contain" loading="lazy" />
          </span>
        ) : null}
        <span
          className={`text-[11px] md:text-xs font-semibold tracking-wide text-neutral-100 ${
            badge.wrap ? "max-w-[7.5rem] text-left leading-tight" : "whitespace-nowrap"
          }`}
        >
          {badge.name}
        </span>

        {/* tooltip (hover on desktop, tap on mobile; always above on mobile) */}
        <span
          className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-md border border-sky-400/30 bg-black/85 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-sky-200 whitespace-nowrap transition-all duration-200 ${
            badge.tipBelow ? "md:top-full md:mt-1.5" : ""
          } ${badge.tipBelow ? "" : "bottom-full mb-1.5"} ${
            shown ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {badge.tip}
        </span>
      </motion.button>
    </motion.div>
  );
}

/* ---------- Main tile ---------- */
const EngineeringToolkit = () => {
  const [active, setActive] = useState(null);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 3D workspace */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 10], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Rig />
            <Stage />
          </Suspense>
        </Canvas>
      </div>

      {/* technical grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 md:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 78%)",
        }}
      />

      {/* readability scrims */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

      {/* corner brackets (futuristic HUD frame) */}
      {[["top-2 left-2", "border-t border-l"], ["top-2 right-2", "border-t border-r"], ["bottom-2 left-2", "border-b border-l"], ["bottom-2 right-2", "border-b border-r"]].map(([pos, edges]) => (
        <div key={pos} className={`pointer-events-none absolute ${pos} ${edges} h-4 w-4 border-sky-400/25`} />
      ))}

      {/* overlay: heading + badges */}
      <div className="absolute inset-0 z-10 flex flex-col md:block">
        <div className="relative z-10 px-3 pt-3 text-center md:absolute md:inset-x-0 md:top-0 md:px-4 md:pt-4">
          <p className="font-bold text-neutral-100 text-[clamp(0.92rem,2.9vw,1.4rem)] tracking-[0.14em] [text-shadow:0_0_18px_rgba(56,189,248,0.35)]">
            MY ENGINEERING TOOLKIT
          </p>
          <p className="mt-1 text-[10px] md:text-xs text-neutral-300 text-pretty px-2">
            Tools I use to transform engineering ideas into functional designs.
          </p>
        </div>

        {/* badges: 2-col grid on mobile, floating slots on desktop */}
        <div className="mt-auto z-10 grid grid-cols-2 gap-2 px-3 pb-3 md:mt-0 md:absolute md:inset-0 md:grid md:gap-0 md:px-0 md:pb-0">
          {/* mobile-only category headers, interleaved with their badges */}
          {BADGES.flatMap((badge, i) => {
            const header = CAT_HEADERS.find((h) => h.before === badge.name);
            const items = [];
            if (header)
              items.push(
                <p key={header.label} className="md:hidden col-span-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-sky-300/70">
                  {header.label}
                </p>
              );
            items.push(
              <SoftwareBadge key={badge.name} badge={badge} index={i} active={active} onActivate={setActive} reduced={reducedMotion} />
            );
            return items;
          })}
        </div>
      </div>
    </div>
  );
};

export default EngineeringToolkit;
