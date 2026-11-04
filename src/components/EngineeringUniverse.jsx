import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Instance,
  Instances,
  Lightformer,
  Line,
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

/* ---------- Animation scheduler (pause / replay / reduced-motion aware) ---------- */
const sim = { time: 0, paused: false };

/* advances the shared clock; mounted first so every part reads fresh state */
function ClockEngine() {
  useFrame((_, dt) => {
    if (!sim.paused) sim.time += Math.min(dt, 0.1);
  });
  return null;
}

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

/* ---------- Shared materials (realistic metalwork) ---------- */
const MATS = {
  // machined cast-aluminium housing
  housing: new THREE.MeshStandardMaterial({ color: "#818a94", metalness: 0.92, roughness: 0.42, envMapIntensity: 0.9 }),
  housingDark: new THREE.MeshStandardMaterial({ color: "#565d66", metalness: 0.9, roughness: 0.5, envMapIntensity: 0.8 }),
  // stainless steels
  steel: new THREE.MeshStandardMaterial({ color: "#bcc3ca", metalness: 1.0, roughness: 0.22, envMapIntensity: 1.25 }),
  steelBrushed: new THREE.MeshStandardMaterial({ color: "#a6aeb6", metalness: 1.0, roughness: 0.38, envMapIntensity: 1.1 }),
  gearSteel: new THREE.MeshStandardMaterial({ color: "#aeb6be", metalness: 1.0, roughness: 0.3, envMapIntensity: 1.15 }),
  // dark gunmetal hardware
  gunmetal: new THREE.MeshStandardMaterial({ color: "#3c4249", metalness: 0.94, roughness: 0.32, envMapIntensity: 1.0 }),
  bolt: new THREE.MeshStandardMaterial({ color: "#33383d", metalness: 0.92, roughness: 0.35, envMapIntensity: 1.0 }),
  // bronze idler gear
  brass: new THREE.MeshStandardMaterial({ color: "#b3873e", metalness: 1.0, roughness: 0.34, envMapIntensity: 1.05 }),
  // bearing races + rolling elements
  race: new THREE.MeshStandardMaterial({ color: "#d3dae1", metalness: 1.0, roughness: 0.14, envMapIntensity: 1.4 }),
  cap: new THREE.MeshStandardMaterial({ color: "#454c54", metalness: 0.92, roughness: 0.42, envMapIntensity: 0.9 }),
  // electric-blue emissive accents
  emissive: new THREE.MeshStandardMaterial({
    color: "#0a1620", emissive: "#38bdf8", emissiveIntensity: 2.2,
    metalness: 0.4, roughness: 0.4,
  }),
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
GEO.holoRing = new THREE.RingGeometry(8.4, 8.52, 96);
GEO.holoRingThin = new THREE.RingGeometry(9.05, 9.1, 96);
GEO.holoArc = new THREE.RingGeometry(8.6, 8.85, 48, 1, 0, Math.PI / 4);

/* extra fastener geometries (axis = Y) */
const SHANK = new THREE.CylinderGeometry(0.075, 0.075, 0.5, 14);
const WASHER = new THREE.CylinderGeometry(0.21, 0.21, 0.03, 20);
const FLANGE_NUT = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 6);

const HOLO = {
  glow: new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }),
  dim: new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }),
};

/* hex-head bolt geometry (head + washer), axis = Y */
function makeBoltHead() {
  return new THREE.CylinderGeometry(0.16, 0.16, 0.13, 6);
}
const HEX_HEAD = makeBoltHead();

/* ---------- Explode-aware part wrapper ---------- */
function ExplodePart({ position = [0, 0, 0], offset = [0, 0, 0], delay = 0, children }) {
  const ref = useRef();
  useFrame(() => {
    const { p } = cycleState(sim.time);
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
  useFrame((_, dt) => {
    // rotation slows down while exploded so parts are easy to inspect
    const { p } = cycleState(sim.time);
    const slow = 1 - 0.9 * p;
    ref.current.rotation.z += ratio * OMEGA * Math.min(dt, 0.1) * slow;
  });
  return (
    <ExplodePart position={position} offset={offset} delay={delay}>
      <group ref={ref} rotation={[0, 0, base]}>
        <mesh geometry={geometry} material={material} castShadow receiveShadow />
      </group>
    </ExplodePart>
  );
}

/* ---------- Spacers & shaft collars (separate along the shaft axis) ---------- */
function Spacer({ position, offset, delay = 0.42 }) {
  return (
    <ExplodePart position={position} offset={offset} delay={delay}>
      <mesh material={MATS.steelBrushed} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.22, 24]} />
      </mesh>
    </ExplodePart>
  );
}

function ShaftCollar({ position, offset, delay = 0.5 }) {
  return (
    <ExplodePart position={position} offset={offset} delay={delay}>
      <mesh material={MATS.gunmetal} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.18, 24]} />
      </mesh>
      {/* set-screw boss on top of the collar */}
      <mesh material={MATS.bolt} position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
      </mesh>
    </ExplodePart>
  );
}

/* ---------- Mounting base + holographic platform ---------- */
function MountingBase() {
  const arcA = useRef();
  const arcB = useRef();
  useFrame((_, dt) => {
    if (arcA.current) arcA.current.rotation.z -= dt * 0.5;
    if (arcB.current) arcB.current.rotation.z += dt * 0.35;
  });
  const anchors = [-6.6, -3.96, -1.32, 1.32, 3.96, 6.6];
  return (
    <ExplodePart position={[0, 0, 0]} offset={[0, -2.9, 0]} delay={0.15}>
      {/* holographic platform rings */}
      <mesh geometry={GEO.holoRing} material={HOLO.dim} rotation={[Math.PI / 2, 0, 0]} position={[0.5, -4.2, 0]} />
      <mesh geometry={GEO.holoRingThin} material={HOLO.dim} rotation={[Math.PI / 2, 0, 0]} position={[0.5, -4.24, 0]} />
      <group ref={arcA} rotation={[Math.PI / 2 + 0.001, 0, 0]} position={[0.5, -4.2, 0]}>
        <mesh geometry={GEO.holoArc} material={HOLO.glow} />
      </group>
      <group ref={arcB} rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -4.2, 0]}>
        <mesh geometry={GEO.holoArc} material={HOLO.glow} />
      </group>
      {/* cast base plate */}
      <mesh material={MATS.housingDark} position={[0.5, -3.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[15.6, 0.5, 5.4]} />
      </mesh>
      {/* chassis rails */}
      {[-2.2, 2.2].map((z) => (
        <mesh key={z} material={MATS.gunmetal} position={[0.5, -3.61, z]} castShadow receiveShadow>
          <boxGeometry args={[15.7, 0.16, 0.5]} />
        </mesh>
      ))}
      {/* emissive edge strips */}
      {[-2.72, 2.72].map((z) => (
        <mesh key={z} material={MATS.emissive} position={[0.5, -3.66, z]}>
          <boxGeometry args={[15.7, 0.06, 0.06]} />
        </mesh>
      ))}
      {/* anchor bolts */}
      {anchors.map((x) => (
        <group key={x} position={[x + 0.5, 0, 0]}>
          <mesh geometry={HEX_HEAD} material={MATS.bolt} position={[0, -3.52, 0]} castShadow />
          <mesh material={MATS.steel} position={[0, -3.63, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.03, 20]} />
          </mesh>
          <mesh material={MATS.bolt} position={[0, -3.85, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.56, 14]} />
          </mesh>
        </group>
      ))}
      <ContactShadows
        position={[0.5, -3.62, 0]}
        opacity={0.55}
        scale={30}
        blur={2.6}
        far={12}
        resolution={512}
      />
    </ExplodePart>
  );
}

/* ---------- Inspection cover (circular flange + 6 bolts) ---------- */
function InspectionCover() {
  return (
    <ExplodePart position={[2.3, 3.27, 0]} offset={[0, 4.3, 0]} delay={0.55}>
      <mesh material={MATS.housing} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.14, 40]} />
      </mesh>
      <mesh material={MATS.emissive} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.076, 0]}>
        <torusGeometry args={[0.45, 0.015, 8, 40]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36]}>
            <mesh geometry={HEX_HEAD} material={MATS.bolt} position={[0, 0.13, 0]} castShadow />
            <mesh material={MATS.bolt} position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.38, 10]} />
            </mesh>
          </group>
        );
      })}
    </ExplodePart>
  );
}

/* ---------- Split-line fasteners: 16 instanced bolts + nuts ---------- */
function FlangeBoltRow() {
  const pts = [];
  BOLT_XS.forEach((x) => {
    pts.push([x - 0.5, 0, 1.975]);
    pts.push([x - 0.5, 0, -1.975]);
  });
  return (
    <ExplodePart position={[0.5, 0, 0]} offset={[0, 2.6, 0]} delay={0.05}>
      <Instances geometry={HEX_HEAD} material={MATS.bolt} limit={16} range={16}>
        {pts.map((p, i) => (
          <Instance key={i} position={[p[0], 0.245, p[2]]} />
        ))}
      </Instances>
      <Instances geometry={WASHER} material={MATS.steel} limit={16} range={16}>
        {pts.map((p, i) => (
          <Instance key={i} position={[p[0], 0.17, p[2]]} />
        ))}
      </Instances>
      <Instances geometry={SHANK} material={MATS.bolt} limit={16} range={16}>
        {pts.map((p, i) => (
          <Instance key={i} position={[p[0], -0.02, p[2]]} />
        ))}
      </Instances>
      <Instances geometry={FLANGE_NUT} material={MATS.bolt} limit={16} range={16}>
        {pts.map((p, i) => (
          <Instance key={i} position={[p[0], -0.32, p[2]]} />
        ))}
      </Instances>
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

/* ---------- Fasteners (cap bolts below; split-line row uses instancing) ---------- */

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

/* ---------- Blueprint-style technical backdrop ---------- */
function BlueprintBackdrop() {
  const circle = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 9.5, Math.sin(a) * 9.5, 0));
    }
    return pts;
  }, []);
  const ticks = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r0 = i % 6 === 0 ? 8.9 : 9.2;
      pts.push(new THREE.Vector3(Math.cos(a) * r0, Math.sin(a) * r0, 0));
      pts.push(new THREE.Vector3(Math.cos(a) * 9.5, Math.sin(a) * 9.5, 0));
    }
    return pts;
  }, []);
  return (
    <group position={[0.5, 0, -4.5]}>
      <Line points={circle} color="#38bdf8" transparent opacity={0.16} lineWidth={1} dashed={false} />
      <Line points={ticks} color="#38bdf8" transparent opacity={0.1} lineWidth={1} dashed={false} />
      <Line
        points={[[0, 10.6, 0], [0, -10.6, 0]]}
        color="#38bdf8"
        transparent
        opacity={0.1}
        lineWidth={1}
      />
      <Line
        points={[[10.6, 0, 0], [-10.6, 0, 0]]}
        color="#38bdf8"
        transparent
        opacity={0.1}
        lineWidth={1}
      />
    </group>
  );
}

/* ---------- Scene root ---------- */
function SceneContent({ onPhase }) {
  const stage = useRef();
  const lastPhase = useRef("");
  const { size } = useThree();
  const fitScale = THREE.MathUtils.clamp(
    (size.width / Math.max(1, size.height)) * (size.width < 400 ? 1.1 : 0.95),
    size.width < 400 ? 0.65 : 0.55,
    1
  );

  useFrame((_, dt) => {
    const { p, phase } = cycleState(sim.time);
    stage.current.rotation.y += Math.min(dt, 0.1) * 0.28 * (1 - 0.72 * p);
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

      {/* ============ MOUNTING BASE + HOLOGRAPHIC PLATFORM ============ */}
      <MountingBase />

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

      {/* ============ FLANGE / SPLIT-LINE BOLTS (16, instanced) ============ */}
      <FlangeBoltRow />

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

      {/* ============ INSPECTION COVER (top circular flange) ============ */}
      <InspectionCover />

      {/* ============ GEAR TRAIN (explodes along shaft axes) ============ */}
      <Gear geometry={GEO.gearA} material={MATS.gearSteel} base={0} ratio={1}
        position={[X_IN, 0, Z_G1]} offset={[0, 0, -1.9]} delay={0.22} />
      <Gear geometry={GEO.gearB} material={MATS.gearSteel} base={(3 * Math.PI) / NB} ratio={-NA / NB}
        position={[0, 0, Z_G1]} offset={[0, 0, 2.1]} delay={0.3} />
      <Gear geometry={GEO.gearC} material={MATS.brass} base={0} ratio={-NA / NB}
        position={[0, 0, Z_G2]} offset={[0, 0, 2.55]} delay={0.38} />
      <Gear geometry={GEO.gearD} material={MATS.gearSteel} base={(3 * Math.PI) / NB} ratio={NA / (NB * 2)}
        position={[X_OUT, 0, Z_G2]} offset={[0, 0, 4.3]} delay={0.46} />

      {/* ============ SPACERS & SHAFT COLLARS ============ */}
      <Spacer position={[X_IN, 0, 0.2]} offset={[0, 0, 5.6]} delay={0.5} />
      <ShaftCollar position={[X_IN, 0, -1.15]} offset={[0, 0, -1.9]} delay={0.56} />
      <Spacer position={[0, 0, -1.06]} offset={[0, 0, -1.9]} delay={0.5} />
      <Spacer position={[0, 0, 0]} offset={[0, 0, 3.8]} delay={0.56} />
      <Spacer position={[0, 0, 1.06]} offset={[0, 0, 3.8]} delay={0.6} />
      <Spacer position={[X_OUT, 0, -1.06]} offset={[0, 0, -1.9]} delay={0.5} />
      <Spacer position={[X_OUT, 0, 1.06]} offset={[0, 0, 5.4]} delay={0.62} />
    </group>
  );
}

function ResponsiveCamera() {
  const { camera, gl, size, controls } = useThree();

  useEffect(() => {
    camera.position.set(6, 5, size.width < 400 ? 24 : 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    gl.domElement.style.touchAction = size.width < 640 ? "none" : "auto";
    // keep the saved camera state in sync so "reset camera" works on every device
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
      controls.saveState();
    }
  }, [camera, gl, size.width, controls]);

  return null;
}

/* shaft helper removed — rotation handled per part */
/* ---------- Public component ---------- */
const STATUS_STYLE = {
  ASSEMBLED: { txt: "ASSEMBLED · RUNNING", dot: "#4ade80", rpm: 1800 },
  "EXPLODING": { txt: "EXPLODING", dot: "#60a5fa", rpm: 900 },
  "EXPLODED VIEW": { txt: "EXPLODED VIEW", dot: "#f472b6", rpm: 180 },
  REASSEMBLING: { txt: "REASSEMBLING", dot: "#facc15", rpm: 900 },
};

const EngineeringUniverse = () => {
  const controlsRef = useRef();
  const [paused, setPaused] = useState(() => {
    // respect reduced-motion preferences: show the static exploded drawing
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      sim.paused = true;
      sim.time = CYCLE.assembled + CYCLE.explode + 0.5;
    }
    return sim.paused;
  });
  const [phase, setPhase] = useState("ASSEMBLED");
  const style = STATUS_STYLE[phase] ?? STATUS_STYLE.ASSEMBLED;

  const togglePause = () => {
    sim.paused = !sim.paused;
    setPaused(sim.paused);
  };
  const replay = () => {
    sim.time = CYCLE.assembled;
    if (sim.paused) {
      sim.paused = false;
      setPaused(false);
    }
  };
  const resetCamera = () => controlsRef.current?.reset();

  const controls = [
    { icon: paused ? "▶" : "❚❚", title: paused ? "Resume animation" : "Pause animation", fn: togglePause },
    { icon: "⟲", title: "Replay explosion", fn: replay },
    { icon: "⌖", title: "Reset camera", fn: resetCamera },
  ];

  return (
    <div className="absolute inset-x-0 bottom-0 top-[45%] lg:inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [6, 5, 20], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
      <ResponsiveCamera />
      <ClockEngine />
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 10, 8]} intensity={1.5} color="#fff4e0" castShadow />
      <directionalLight position={[-8, 4, -6]} intensity={0.6} color="#7fb4ff" />
      <pointLight position={[0, -4, 6]} intensity={14} distance={14} color="#38bdf8" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[4, 8, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[-8, 4, -6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.5} position={[0, -6, 4]} scale={[8, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} position={[0, 3, -10]} scale={[12, 8, 1]} target={[0, 0, 0]} />
      </Environment>
      <BlueprintBackdrop />
      <Suspense fallback={null}>
        <SceneContent onPhase={setPhase} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={true}
        minDistance={9}
        maxDistance={36}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.62}
      />
    </Canvas>
    {/* HUD: corner brackets */}
    {[["top-2 left-2", "border-t border-l"], ["top-2 right-2", "border-t border-r"], ["bottom-2 left-2", "border-b border-l"], ["bottom-2 right-2", "border-b border-r"]].map(([pos, edges]) => (
      <div key={pos} className={`pointer-events-none absolute ${pos} ${edges} h-4 w-4 border-sky-400/25`} />
    ))}

    {/* phase status chip */}
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur-md">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: style.dot, boxShadow: `0 0 8px ${style.dot}` }}
      />
      <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-neutral-300">
        {style.txt} · IN {style.rpm} RPM{paused ? " · PAUSED" : ""}
      </span>
    </div>

    {/* minimal control cluster */}
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
  );
};

export default EngineeringUniverse;
