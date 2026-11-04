import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Line } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
   TURBINE KIT — shared clock, cycle, materials, stage set-dressing.
   Mirrors the pattern used by EngineeringUniverse (gearbox).
   ============================================================ */

/* ---------- Cycle timing (seconds) — ~15.4 s per full loop ---------- */
export const CYCLE = { assembled: 4.0, explode: 3.4, exploded: 4.6, reassemble: 3.4 };
export const CYCLE_TOTAL =
  CYCLE.assembled + CYCLE.explode + CYCLE.exploded + CYCLE.reassemble;

export const PHASES = [
  { name: "ASSEMBLED", start: 0, end: CYCLE.assembled },
  { name: "EXPLODING", start: CYCLE.assembled, end: CYCLE.assembled + CYCLE.explode },
  {
    name: "EXPLODED VIEW",
    start: CYCLE.assembled + CYCLE.explode,
    end: CYCLE.assembled + CYCLE.explode + CYCLE.exploded,
  },
  {
    name: "REASSEMBLING",
    start: CYCLE.assembled + CYCLE.explode + CYCLE.exploded,
    end: CYCLE_TOTAL,
  },
];

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* ---------- Shared clock ---------- */
export const sim = { time: 0, paused: false };

/* Mounted first so every part reads fresh state each frame. */
export function ClockEngine() {
  useFrame((_, dt) => {
    if (!sim.paused) sim.time += Math.min(dt, 0.1);
  });
  return null;
}

/* Returns current phase + eased explode progress p (0 assembled → 1 exploded) */
export function cycleState(elapsed) {
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

/* ---------- Rotor speed (rad/s) — slows while exploded for inspection ---------- */
export const rotorSpeed = (p) => (1 - 0.92 * p);

/* ---------- Materials — brushed / titanium / gunmetal metals ---------- */
export const MATS = {
  casing: new THREE.MeshStandardMaterial({
    color: "#9aa2ac", metalness: 0.92, roughness: 0.4, envMapIntensity: 0.95,
  }),
  casingDark: new THREE.MeshStandardMaterial({
    color: "#6a737d", metalness: 0.9, roughness: 0.48, envMapIntensity: 0.8,
  }),
  titanium: new THREE.MeshStandardMaterial({
    color: "#b6c2cc", metalness: 1.0, roughness: 0.26, envMapIntensity: 1.3,
  }),
  discSteel: new THREE.MeshStandardMaterial({
    color: "#a8b0b8", metalness: 1.0, roughness: 0.32, envMapIntensity: 1.15,
  }),
  shaft: new THREE.MeshStandardMaterial({
    color: "#d6dce2", metalness: 1.0, roughness: 0.12, envMapIntensity: 1.55,
  }),
  gunmetal: new THREE.MeshStandardMaterial({
    color: "#353b41", metalness: 0.95, roughness: 0.38, envMapIntensity: 1.0,
  }),
  bolt: new THREE.MeshStandardMaterial({
    color: "#2d3338", metalness: 0.9, roughness: 0.42, envMapIntensity: 0.9,
  }),
  race: new THREE.MeshStandardMaterial({
    color: "#dbe2e8", metalness: 1.0, roughness: 0.1, envMapIntensity: 1.5,
  }),
  brass: new THREE.MeshStandardMaterial({
    color: "#a87f3f", metalness: 1.0, roughness: 0.35, envMapIntensity: 1.0,
  }),
  can: new THREE.MeshStandardMaterial({
    color: "#6e7883", metalness: 0.95, roughness: 0.3, envMapIntensity: 1.0,
  }),
  emissive: new THREE.MeshStandardMaterial({
    color: "#0a1620", emissive: "#38bdf8", emissiveIntensity: 2.0,
    metalness: 0.4, roughness: 0.4,
  }),
};

/* ---------- Explode-aware part wrapper ---------- */
export function ExplodePart({ position = [0, 0, 0], offset = [0, 0, 0], delay = 0, children }) {
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

/* ---------- Shape helper: annulus extruded along Z (rotate to engine axis) ---------- */
export function ringGeo(rIn, rOut, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 40 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/* ---------- Shared geometries ---------- */
export const GEO = {
  boltHead: new THREE.CylinderGeometry(0.14, 0.14, 0.12, 6),          // axis Y
  boltShank: new THREE.CylinderGeometry(0.06, 0.06, 0.36, 10),        // axis Y
  nut: new THREE.CylinderGeometry(0.13, 0.13, 0.1, 6),                // axis Y
};
/* rotate to engine axis (X): cylinder axis Y → X */
GEO.boltHead.rotateZ(Math.PI / 2);
GEO.boltShank.rotateZ(Math.PI / 2);
GEO.nut.rotateZ(Math.PI / 2);

export const holoMats = {
  glow: new THREE.MeshBasicMaterial({
    color: "#38bdf8", transparent: true, opacity: 0.4,
    side: THREE.DoubleSide, depthWrite: false,
  }),
  dim: new THREE.MeshBasicMaterial({
    color: "#38bdf8", transparent: true, opacity: 0.14,
    side: THREE.DoubleSide, depthWrite: false,
  }),
};

/* ---------- Circular display platform (static, never explodes) ---------- */
export function DisplayPlatform() {
  return (
    <group>
      {/* slab */}
      <mesh material={MATS.gunmetal} position={[0, -3.42, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.5, 0.3, 72]} />
      </mesh>
      {/* illuminated blue rings */}
      <mesh material={MATS.emissive} position={[0, -3.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.6, 0.025, 8, 96]} />
      </mesh>
      <mesh material={MATS.emissive} position={[0, -3.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.55, 0.02, 8, 96]} />
      </mesh>
      {/* faint structural ring */}
      <mesh material={MATS.casingDark} position={[0, -3.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.05, 0.05, 8, 96]} />
      </mesh>
      <ContactShadows position={[0, -3.26, 0]} opacity={0.6} scale={24} blur={2.4} far={10} resolution={512} />
    </group>
  );
}

/* ---------- Technical backdrop: rings, axis + cross lines ---------- */
export function Backdrop() {
  const circles = useMemo(
    () => [
      { r: 6.8, o: 0.14 },
      { r: 8.0, o: 0.09 },
    ],
    []
  );
  const pts = (r) => {
    const arr = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      arr.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    return arr;
  };
  return (
    <group position={[0, 0, -4.6]}>
      {circles.map(({ r, o }) => (
        <Line key={r} points={pts(r)} color="#38bdf8" transparent opacity={o} lineWidth={1} />
      ))}
      <Line points={[[-9, 0, 0], [9, 0, 0]]} color="#38bdf8" transparent opacity={0.12} lineWidth={1} />
      <Line points={[[0, 4.6, 0], [0, -4.6, 0]]} color="#38bdf8" transparent opacity={0.09} lineWidth={1} />
      {/* frame corners */}
      <Line
        points={[
          [-4.2, 4.6, 0], [-4.2, 4.25, 0], [-3.85, 4.25, 0],
        ]}
        color="#38bdf8" transparent opacity={0.18} lineWidth={1}
      />
      <Line
        points={[
          [4.2, 4.6, 0], [4.2, 4.25, 0], [3.85, 4.25, 0],
        ]}
        color="#38bdf8" transparent opacity={0.18} lineWidth={1}
      />
    </group>
  );
}

/* ---------- Subtle floating particles ---------- */
export function Particles({ count = 80 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.2 + Math.random() * 5.6;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = -2.6 + Math.random() * 6.6;
      arr[i * 3 + 2] = Math.sin(a) * r * 0.6 - 1.0;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.045;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#7dd3fc" size={0.045} sizeAttenuation
        transparent opacity={0.45} depthWrite={false}
      />
    </points>
  );
}

/* ---------- Initial camera placement + touch handling ---------- */
export function ResponsiveCamera() {
  const { camera, gl, size, controls } = useThree();
  useEffect(() => {
    camera.position.set(9.2, 4.6, 13.6);
    camera.lookAt(0, -0.35, 0);
    camera.updateProjectionMatrix();
    gl.domElement.style.touchAction = size.width < 640 ? "none" : "auto";
    if (controls) {
      controls.target.set(0, -0.35, 0);
      controls.update();
      controls.saveState();
    }
  }, [camera, gl, size.width, controls]);
  return null;
}

/* ---------- Auto-framing: keeps the exploded span in frame when the
   visitor is not actively dragging/zooming (idle only, eased). ---------- */
export function AutoFramer() {
  const { camera, controls, size } = useThree();
  const idle = useRef(true);
  const offTimer = useRef();

  useEffect(() => {
    if (!controls) return;
    const start = () => (idle.current = false);
    const end = () => {
      idle.current = true;
      clearTimeout(offTimer.current);
    };
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    return () => {
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
      clearTimeout(offTimer.current);
    };
  }, [controls]);

  useFrame((_, dt) => {
    if (!controls || !idle.current) return;
    const { p } = cycleState(sim.time);
    const spanFit = 0.78; // matches stage fitScale so distances agree
    const spanAssembled = 12.5 * spanFit;
    const spanExploded = 19.2 * spanFit;
    const span = THREE.MathUtils.lerp(spanAssembled, spanExploded, p);

    const aspect = size.width / Math.max(1, size.height);
    const vHalf = ((camera.fov || 38) * Math.PI) / 180 / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const desired = THREE.MathUtils.clamp(span / (2 * Math.tan(hHalf)), 9.5, 34);

    const target = controls.target;
    const cur = camera.position.distanceTo(target);
    if (Math.abs(cur - desired) / desired < 0.08) return;

    const next = THREE.MathUtils.damp(cur, desired, 1.8, Math.min(dt, 0.1));
    const dir = camera.position.clone().sub(target).normalize();
    camera.position.copy(target).addScaledVector(dir, next);
  });

  return null;
}
