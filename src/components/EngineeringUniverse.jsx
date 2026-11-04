import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
   ENGINEERING UNIVERSE
   Procedural split-case gearbox that continuously:
   rotates assembled → explodes → holds → reassembles.
   ============================================================ */

/* ---------- Timing (seconds) ---------- */
const CYCLE = { assembled: 4.2, explode: 3.0, exploded: 4.2, reassemble: 3.0 };
const CYCLE_TOTAL =
  CYCLE.assembled + CYCLE.explode + CYCLE.exploded + CYCLE.reassemble;

const PHASES = [
  { name: "ASSEMBLED", start: 0, end: CYCLE.assembled },
  { name: "EXPLODING", start: CYCLE.assembled, end: CYCLE.assembled + CYCLE.explode },
  { name: "EXPLODED VIEW", start: CYCLE.assembled + CYCLE.explode, end: CYCLE.assembled + CYCLE.explode + CYCLE.exploded },
  { name: "REASSEMBLING", start: CYCLE.assembled + CYCLE.explode + CYCLE.exploded, end: CYCLE_TOTAL },
];

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function cycleState(elapsed) {
  const k = elapsed % CYCLE_TOTAL;
  for (const ph of PHASES) {
    if (k >= ph.start && k < ph.end) {
      let p = 0;
      if (ph.name === "EXPLODING" || ph.name === "REASSEMBLING") {
        const raw = (k - ph.start) / (ph.end - ph.start);
        p = easeInOutCubic(raw);
        if (ph.name === "REASSEMBLING") p = 1 - p;
      } else if (ph.name === "EXPLODED VIEW") p = 1;
      return { phase: ph.name, p };
    }
  }
  return { phase: "ASSEMBLED", p: 0 };
}

/* ---------- Gear-train layout (units ~dm) ---------- */
const GEAR_MODULE = 0.1;
const NA = 26, NB = 52;
const rA = (NA * GEAR_MODULE) / 2; // 1.30
const rB = (NB * GEAR_MODULE) / 2; // 2.60
const X_IN = -(rA + rB);  // -3.9 : input shaft
const X_OUT = rA + rB;   // +3.9 : output shaft
const Z_G1 = -0.65; // lane A/B
const Z_G2 = 0.65;  // lane C/D
const OMEGA = 0.55; // input shaft speed

const BOLT_XS = [-5.0, -3.44, -1.88, -0.32, 1.24, 2.8, 4.36, 5.92];
const SHAFT_XS = [X_IN, 0, X_OUT];

/* ---------- Shared materials ---------- */
const MATS = {
  housing: new THREE.MeshStandardMaterial({ color: "#363b41", metalness: 0.85, roughness: 0.55 }),
  steel: new THREE.MeshStandardMaterial({ color: "#b9c0c8", metalness: 1.0, roughness: 0.3 }),
  gearSteel: new THREE.MeshStandardMaterial({ color: "#a9b2ba", metalness: 1.0, roughness: 0.32 }),
  brass: new THREE.MeshStandardMaterial({ color: "#c9a24f", metalness: 1.0, roughness: 0.35 }),
  bolt: new THREE.MeshStandardMaterial({ color: "#2c3034", metalness: 0.9, roughness: 0.42 }),
  race: new THREE.MeshStandardMaterial({ color: "#cfd6dd", metalness: 1.0, roughness: 0.2 }),
  cap: new THREE.MeshStandardMaterial({ color: "#3d434a", metalness: 0.85, roughness: 0.5 }),
};

/* ---------- Shape helpers ---------- */
const rectHole = (cx, cy, r) => {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, true);
  return p;
};

/**
 * Rectangular plate with optional:
 *  - circular holes:  [{x, y, r}]
 *  - edge notches:    [{edge:"top"|"bottom", x, w, d}]
 * Boundary is built CCW; notches keep the path valid.
 */
function plateGeometry({ x0, x1, y0, y1, holes = [], notches = [], depth, bevel = 0.012 }) {
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  // bottom edge L→R
  const bNotches = notches.filter((n) => n.edge === "bottom").sort((a, b) => a.x - b.x);
  for (const n of bNotches) {
    const hw = n.w / 2;
    s.lineTo(n.x - hw, y0);
    s.lineTo(n.x - hw, y0 + n.d);
    s.lineTo(n.x + hw, y0 + n.d);
    s.lineTo(n.x + hw, y0);
  }
  s.lineTo(x1, y0);
  // right edge
  s.lineTo(x1, y1);
  // top edge R→L
  const tNotches = notches.filter((n) => n.edge === "top").sort((a, b) => b.x - a.x);
  for (const n of tNotches) {
    const hw = n.w / 2;
    s.lineTo(n.x + hw, y1);
    s.lineTo(n.x + hw, y1 - n.d);
    s.lineTo(n.x - hw, y1 - n.d);
    s.lineTo(n.x - hw, y1);
  }
  s.lineTo(x0, y1);
  s.closePath();

  for (const h of holes) s.holes.push(rectHole(h.x, h.y, h.r));

  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 24,
  });
  return geo;
}

/* ---------- Gear geometry (trapezoidal teeth + bore + web holes) ---------- */
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
  shape.holes.push(rectHole(0, 0, hubR));
  if (ringHoles) {
    const orbit = (hubR + rRoot) / 2;
    const holeR = (rRoot - hubR) / 2.6;
    for (let i = 0; i < ringHoles; i++) {
      const a = (i / ringHoles) * Math.PI * 2;
      shape.holes.push(rectHole(Math.cos(a) * orbit, Math.sin(a) * orbit, holeR));
    }
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width, bevelEnabled: true, bevelThickness: 0.012,
    bevelSize: 0.012, bevelSegments: 1, curveSegments: 6,
  });
  geo.translate(0, 0, -width / 2);
  return geo;
}

/* ---------- Cached geometries ---------- */
const GEO = {
  gearA: makeGearGeometry({ teeth: NA, module: GEAR_MODULE, width: 0.55, hubR: 0.38 }),
  gearB: makeGearGeometry({ teeth: NB, module: GEAR_MODULE, width: 0.6, hubR: 0.45, ringHoles: 5 }),
  gearC: makeGearGeometry({ teeth: NA, module: GEAR_MODULE, width: 0.55, hubR: 0.38 }),
  gearD: makeGearGeometry({ teeth: NB, module: GEAR_MODULE, width: 0.6, hubR: 0.45, ringHoles: 5 }),
  frameUpper: plateGeometry({ x0: -6, x1: 7, y0: 0, y1: 3.2, depth: 0.25, notches: [{ edge: "bottom", x: 0.5, w: 10.2, d: 2.95 }] }),
  frameLower: plateGeometry({ x0: -6, x1: 7, y0: -3.2, y1: 0, depth: 0.25, notches: [{ edge: "top", x: 0.5, w: 10.2, d: 2.95 }] }),
  stripUpper: plateGeometry({ x0: -6.85, x1: 7.95, y0: 0, y1: 0.16, depth: 0.35, bevel: 0, notches: SHAFT_XS.map((x) => ({ edge: "bottom", x, w: 1.0, d: 0.16 })), holes: BOLT_XS.map((x) => ({ x, y: 0.08, r: 0.07 })) }),
  stripLower: plateGeometry({ x0: -6.85, x1: 7.95, y0: -0.16, y1: 0, depth: 0.35, bevel: 0, notches: SHAFT_XS.map((x) => ({ edge: "top", x, w: 1.0, d: 0.16 })), holes: BOLT_XS.map((x) => ({ x, y: -0.08, r: 0.07 })) }),
  pedestal: plateGeometry({ x0: -0.72, x1: 0.72, y0: -3.2, y1: 1.0, depth: 0.6, holes: [{ x: 0, y: 0, r: 0.69 }] }),
  capPlate: plateGeometry({ x0: -6, x1: 7, y0: -3.2, y1: 3.2, depth: 0.25, holes: SHAFT_XS.map((x) => ({ x, y: 0, r: 0.69 })) }),
  bossRing: null, // built below
};

/* ring (annulus) extruded along Z */
function makeRingGeo(rIn, rOut, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  s.holes.push(rectHole(0, 0, rIn));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 32 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}
GEO.bossRing = makeRingGeo(0.7, 0.98, 0.8);
GEO.raceOuter = makeRingGeo(0.55, 0.68, 0.34);
GEO.raceInner = makeRingGeo(0.31, 0.4, 0.5);

/* hex-head bolt geometry (head + washer), axis = Y */
function makeBoltHead() {
  return new THREE.CylinderGeometry(0.16, 0.16, 0.13, 6);
}
const HEX_HEAD = makeBoltHead();

/* ---------- Explode-aware part wrapper ---------- */
function ExplodePart({ position = [0, 0, 0], offset = [0, 0, 0], delay = 0, children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const { p } = cycleState(clock.elapsedTime);
    const d = 0.25 * delay;
    const pe = easeInOutCubic(clamp01((p - d) / 0.75));
    ref.current.position.set(
      position[0] + offset[0] * pe,
      position[1] + offset[1] * pe,
      position[2] + offset[2] * pe
    );
  });
  return <group ref={ref}>{children}</group>;
}

/* ---------- Gear: spins about Z with exact mesh phase ---------- */
function Gear({ geometry, material, base, ratio, position, offset, delay }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.z = base + ratio * OMEGA * state.clock.elapsedTime;
  });
  return (
    <ExplodePart position={position} offset={offset} delay={delay}>
      <group ref={ref}>
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
      </group>
    </ExplodePart>
  );
}

/* ---------- Housing pieces ---------- */
const TopPlate = () => (
  <mesh material={MATS.housing} position={[0.5, 3.05, 0]} castShadow receiveShadow>
    <boxGeometry args={[13, 0.3, 3.8]} />
  </mesh>
);

const BottomPlate = () => (
  <mesh material={MATS.housing} position={[0.5, -3.05, 0]} castShadow receiveShadow>
    <boxGeometry args={[13, 0.3, 3.8]} />
  </mesh>
);

const Rib = ({ z }) => (
  <mesh material={MATS.housing} position={[0.5, 3.26, z]} castShadow>
    <boxGeometry args={[13, 0.12, 0.24]} />
  </mesh>
);

const Pillar = ({ x, y, z }) => (
  <mesh material={MATS.housing} position={[x, y, z]} castShadow receiveShadow>
    <boxGeometry args={[0.5, 3.2, 0.5]} />
  </mesh>
);

const Foot = ({ x }) => (
  <mesh material={MATS.housing} position={[x, -3.42, 0]} receiveShadow>
    <boxGeometry args={[1.5, 0.45, 3.4]} />
  </mesh>
);

/* ---------- Fasteners ---------- */
function FlangeBolt({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={HEX_HEAD} material={MATS.bolt} position={[0, 0.245, 0]} castShadow />
      <mesh material={MATS.steel} position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.03, 20]} />
      </mesh>
      <mesh material={MATS.bolt} position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.44, 14]} />
      </mesh>
    </group>
  );
}

function CapBolt({ x, y }) {
  return (
    <group position={[x, y, 2.15]}>
      <mesh geometry={HEX_HEAD} material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.07]} castShadow />
      <mesh material={MATS.steel} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.21, 0.21, 0.03, 20]} />
      </mesh>
      <mesh material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.075, 0.075, 0.5, 14]} />
      </mesh>
    </group>
  );
}

/* ---------- Bearings ---------- */
function BallRow({ z }) {
  const balls = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      arr.push([Math.cos(a) * 0.475, Math.sin(a) * 0.475]);
    }
    return arr;
  }, []);
  return (
    <group position={[0, 0, z]}>
      {balls.map(([bx, by], i) => (
        <mesh key={i} material={MATS.race} position={[bx, by, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/* outer race seated in the pedestal (stays with lower housing) */
function RaceOuterPedestal({ x }) {
  return (
    <ExplodePart position={[x, 0, -1.38]} offset={[0, -2.3, 0]} delay={0.12}>
      <mesh geometry={GEO.raceOuter} material={MATS.race} castShadow />
    </ExplodePart>
  );
}

/* outer race seated in the end cap (travels with the cap) */
function RaceOuterCap({ x }) {
  return (
    <ExplodePart position={[x, 0, 1.38]} offset={[0, 0, 2.4]} delay={0.18}>
      <mesh geometry={GEO.raceOuter} material={MATS.race} castShadow />
    </ExplodePart>
  );
}

/* inner race + ball row rides the shaft out along Z */
function BearingInner({ x, dz, delay, z }) {
  return (
    <ExplodePart position={[x, 0, z]} offset={[0, 0, dz]} delay={delay}>
      <mesh geometry={GEO.raceInner} material={MATS.race} castShadow />
      <BallRow z={0} />
    </ExplodePart>
  );
}

/* ---------- Scene root ---------- */
function SceneContent({ onPhase }) {
  const stage = useRef();
  const lastPhase = useRef("");
  const { size } = useThree();
  const fitScale = THREE.MathUtils.clamp(
    (size.width / Math.max(1, size.height)) * 0.95,
    0.55,
    1
  );

  useFrame(({ clock }, dt) => {
    stage.current.rotation.y += dt * 0.28;
    const { phase } = cycleState(clock.elapsedTime);
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      onPhase?.(phase);
    }
  });

  return (
    <group ref={stage} position={[-0.5, 0, 0]} scale={fitScale}>
      {/* ============ UPPER HOUSING SHELL ============ */}
      <ExplodePart position={[0.5, 0, 0]} offset={[0, 2.9, 0]} delay={0.5}>
        <mesh geometry={GEO.frameUpper} material={MATS.housing} position={[0, 0, 1.65]} castShadow receiveShadow />
        <mesh geometry={GEO.frameUpper} material={MATS.housing} position={[0, 0, -1.9]} castShadow receiveShadow />
        <mesh geometry={GEO.stripUpper} material={MATS.housing} position={[0, 0, 1.8]} castShadow />
        <mesh geometry={GEO.stripUpper} material={MATS.housing} position={[0, 0, -2.15]} castShadow />
        <TopPlate />
        <Rib z={1.5} />
        <Rib z={-1.5} />
        <Pillar x={6.35} y={1.6} z={1.5} />
        <Pillar x={6.35} y={1.6} z={-1.5} />
        <Pillar x={-6.35} y={1.6} z={1.5} />
        <Pillar x={-6.35} y={1.6} z={-1.5} />
      </ExplodePart>

      {/* ============ LOWER HOUSING SHELL ============ */}
      <ExplodePart position={[0.5, 0, 0]} offset={[0, -2.3, 0]} delay={0.12}>
        <mesh geometry={GEO.frameLower} material={MATS.housing} position={[0, 0, 1.65]} castShadow receiveShadow />
        <mesh geometry={GEO.frameLower} material={MATS.housing} position={[0, 0, -1.9]} castShadow receiveShadow />
        <mesh geometry={GEO.stripLower} material={MATS.housing} position={[0, 0, 1.8]} castShadow />
        <mesh geometry={GEO.stripLower} material={MATS.housing} position={[0, 0, -2.15]} castShadow />
        <BottomPlate />
        <Pillar x={6.35} y={-1.6} z={1.5} />
        <Pillar x={6.35} y={-1.6} z={-1.5} />
        <Pillar x={-6.35} y={-1.6} z={1.5} />
        <Pillar x={-6.35} y={-1.6} z={-1.5} />
        <Foot x={-4.4} />
        <Foot x={5.6} />
      </ExplodePart>

      {/* ============ PEDESTALS (bearing carriers, lower half) ============ */}
      {SHAFT_XS.map((x) => (
        <ExplodePart key={`ped-${x}`} position={[x, 0, -1.68]} offset={[0, -2.3, 0]} delay={0.12}>
          <mesh geometry={GEO.pedestal} material={MATS.housing} castShadow receiveShadow />
        </ExplodePart>
      ))}

      {/* ============ SHAFTS + COUPLING ============ */}
      {[
        { x: X_IN, d: 0.3, dz: 1.7 },
        { x: 0, d: 0.44, dz: 1.15 },
        { x: X_OUT, d: 0.36, dz: 1.7 },
      ].map((s, i) => (
        <ExplodePart key={`shaft-${i}`} position={[s.x, 0, 0]} offset={[0, 0, s.dz]} delay={s.d}>
          <mesh material={MATS.steel} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 3.5, 28]} />
          </mesh>
          <mesh material={i === 2 ? MATS.brass : MATS.steel} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, i === 2 ? -1.95 : 1.95]}>
            <cylinderGeometry args={[0.42, 0.42, 0.42, 24]} />
          </mesh>
        </ExplodePart>
      ))}

      {/* ============ BEARINGS ============ */}
      {SHAFT_XS.map((x) => (
        <RaceOuterPedestal key={`rop-${x}`} x={x} />
      ))}
      {SHAFT_XS.map((x) => (
        <RaceOuterCap key={`roc-${x}`} x={x} />
      ))}
      <BearingInner x={X_IN} dz={1.7} delay={0.3} z={-1.38} />
      <BearingInner x={X_IN} dz={1.7} delay={0.3} z={1.38} />
      <BearingInner x={0} dz={1.15} delay={0.44} z={-1.38} />
      <BearingInner x={0} dz={1.15} delay={0.44} z={1.38} />
      <BearingInner x={X_OUT} dz={1.7} delay={0.36} z={-1.38} />
      <BearingInner x={X_OUT} dz={1.7} delay={0.36} z={1.38} />

      {/* ============ FLANGE / SPLIT-LINE BOLTS (16) ============ */}
      <ExplodePart position={[0.5, 0, 0]} offset={[0, 2.6, 0]} delay={0.05}>
        {BOLT_XS.map((x) => (
          <group key={`b1-${x}`}>
            <FlangeBolt x={x - 0.5} z={1.975} />
            <FlangeBolt x={x - 0.5} z={-1.975} />
          </group>
        ))}
      </ExplodePart>

      {/* ============ REMOVABLE END CAP (+Z access cover) ============ */}
      <ExplodePart position={[0.5, 0, 0]} offset={[0, 0, 2.4]} delay={0.18}>
        <mesh geometry={GEO.capPlate} material={MATS.cap} position={[0, 0, 1.9]} castShadow receiveShadow />
        {SHAFT_XS.map((x) => (
          <mesh key={`boss-${x}`} geometry={GEO.bossRing} material={MATS.cap} position={[x - 0.5, 0, 1.5]} castShadow />
        ))}
      </ExplodePart>
      <ExplodePart position={[0.5, 0, 0]} offset={[0, 0, 3.2]} delay={0.02}>
        <CapBolt x={-5.9} y={2.7} />
        <CapBolt x={-5.9} y={-2.7} />
        <CapBolt x={6.9} y={2.7} />
        <CapBolt x={6.9} y={-2.7} />
      </ExplodePart>

      {/* ============ GEAR TRAIN ============ */}
      <Gear geometry={GEO.gearA} material={MATS.gearSteel} base={0} ratio={1}
        position={[X_IN, 0, Z_G1]} offset={[-2.2, 0, 0.2]} delay={0.22} />
      <Gear geometry={GEO.gearB} material={MATS.gearSteel} base={(3 * Math.PI) / NB} ratio={-NA / NB}
        position={[0, 0, Z_G1]} offset={[-1.6, 0, 0]} delay={0.3} />
      <Gear geometry={GEO.gearC} material={MATS.brass} base={0} ratio={-NA / NB}
        position={[0, 0, Z_G2]} offset={[0, 1.3, 0.5]} delay={0.38} />
      <Gear geometry={GEO.gearD} material={MATS.gearSteel} base={(3 * Math.PI) / NB} ratio={NA / (NB * 2)}
        position={[X_OUT, 0, Z_G2]} offset={[1.8, 0, -0.3]} delay={0.46} />
    </group>
  );
}

/* shaft helper removed — rotation handled per part */
/* ---------- Public component ---------- */
const STATUS_STYLE = {
  ASSEMBLED: { txt: "ASSEMBLED · RUNNING", dot: "#4ade80" },
  "EXPLODING": { txt: "EXPLODING", dot: "#60a5fa" },
  "EXPLODED VIEW": { txt: "EXPLODED VIEW", dot: "#f472b6" },
  REASSEMBLING: { txt: "REASSEMBLING", dot: "#facc15" },
};

const EngineeringUniverse = () => {
  const [phase, setPhase] = useState("ASSEMBLED");
  const style = STATUS_STYLE[phase] ?? STATUS_STYLE.ASSEMBLED;

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [6, 5, 20], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 10, 8]} intensity={1.4} />
      <directionalLight position={[-8, 4, -6]} intensity={0.5} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[4, 8, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} position={[-8, 4, -6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.4} position={[0, -6, 4]} scale={[8, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} position={[0, 3, -10]} scale={[12, 8, 1]} target={[0, 0, 0]} />
      </Environment>
      <ContactShadows
        position={[0, -3.6, 0]}
        opacity={0.55}
        scale={30}
        blur={2.6}
        far={12}
        resolution={512}
      />
      <SceneContent onPhase={setPhase} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={9}
        maxDistance={34}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.62}
      />
    </Canvas>
    {/* phase status chip */}
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur-md">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: style.dot, boxShadow: `0 0 8px ${style.dot}` }}
      />
      <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-neutral-300">
        {style.txt}
      </span>
    </div>
  </div>
  );
};

export default EngineeringUniverse;
