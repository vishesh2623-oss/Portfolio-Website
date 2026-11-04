import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import * as THREE from "three";
import {
  ExplodePart, MATS, GEO, cycleState, sim, rotorSpeed, ringGeo,
} from "./TurbineKit";

/* ============================================================
   PROCEDURAL GAS TURBINE — engine axis = X (front at −X).
   Independently grouped mechanisms:
   • casing shells (top halves explode, bottoms form a static cradle)
   • blade-carrying rotor stages that slide along the shaft
   • combustor, bearings, inlet, exhaust
   ============================================================ */

/* ---------- cached extruded ring geometries ---------- */
const STATOR_GEO = ringGeo(0.98, 1.3, 0.07);
const NGV_GEO = ringGeo(0.95, 1.34, 0.08);
const RACE_F = ringGeo(0.33, 0.46, 0.28);
const RACE_R = ringGeo(0.36, 0.5, 0.3);

/* ---------- rotating helper: spins a group about the engine axis ---------- */
function useRotorSpin(speed) {
  const ref = useRef();
  useFrame((_, dt) => {
    const { p } = cycleState(sim.time);
    if (ref.current) ref.current.rotation.x += Math.min(dt, 0.1) * speed * rotorSpeed(p);
  });
  return ref;
}

/* ---------- Rotor stage: blade-carrying disc, slides along the shaft ---------- */
function RotorStage({
  x, dx, delay, count, rDisc, discW, rMid, bladeLen, chord, thick, tilt,
  speed = 2.3, phase = 0,
}) {
  const spin = useRotorSpin(speed);
  const blades = useMemo(
    () => Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2),
    [count]
  );
  return (
    <ExplodePart position={[x, 0, 0]} offset={[dx, 0, 0]} delay={delay}>
      <group ref={spin} rotation={[phase, 0, 0]}>
        <mesh material={MATS.discSteel} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[rDisc, rDisc, discW, 36]} />
        </mesh>
        {/* machined web */}
        <mesh material={MATS.gunmetal} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[rDisc - 0.12, rDisc - 0.12, discW + 0.05, 28]} />
        </mesh>
        {/* blades stay attached to their disc */}
        <Instances limit={count} range={count} material={MATS.titanium}>
          <boxGeometry args={[chord, bladeLen, thick]} />
          {blades.map((a, i) => (
            <Instance
              key={i}
              position={[0, rMid * Math.cos(a), rMid * Math.sin(a)]}
              rotation={[a, tilt, 0]}
            />
          ))}
        </Instances>
      </group>
    </ExplodePart>
  );
}

/* ---------- stator vane ring (rides with the exploding top casing) ---------- */
function StatorRing({ x, geo = STATOR_GEO, rMid = 1.14, count = 18, tilt = -0.35 }) {
  const vanes = useMemo(
    () => Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2),
    [count]
  );
  return (
    <group>
      <mesh geometry={geo} material={MATS.casingDark} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      <Instances limit={count} range={count}>
        <boxGeometry args={[0.07, 0.32, 0.13]} />
        <meshStandardMaterial color="#7c868f" metalness={0.95} roughness={0.35} envMapIntensity={1.0} />
        {vanes.map((a, i) => (
          <Instance
            key={i}
            position={[x, rMid * Math.cos(a), rMid * Math.sin(a)]}
            rotation={[a, tilt, 0]}
          />
        ))}
      </Instances>
    </group>
  );
}

/* ---------- casing assembly: top half explodes, bottom half is the cradle ---------- */
function CasingAssembly({ xSpan, r, a = 0.9, mat = MATS.casing, delay = 0.6, children }) {
  const [x0, x1] = xSpan;
  const len = x1 - x0;
  const thetaLength = Math.PI - a;
  return (
    <group>
      {/* TOP — lifts clear of the engine */}
      <ExplodePart position={[0, 0, 0]} offset={[0, 2.9, 0]} delay={delay}>
        <mesh
          material={mat}
          position={[(x0 + x1) / 2, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[r, r, len, 48, 1, true, a, thetaLength]} />
        </mesh>
        {/* rim flanges at both cut ends of the top shell */}
        {[x0, x1].map((xe) =>
          [a, Math.PI].map((th) => (
            <mesh
              key={`${xe}-${th}`}
              material={MATS.casingDark}
              position={[xe, r * Math.sin(th), r * Math.cos(th)]}
              rotation={[th, 0, 0]}
            >
              <boxGeometry args={[0.05, 0.16, 0.1]} />
            </mesh>
          ))
        )}
        {children}
      </ExplodePart>
      {/* BOTTOM — static cradle */}
      <mesh
        material={mat}
        position={[(x0 + x1) / 2, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[r, r, len, 48, 1, true, Math.PI, thetaLength]} />
      </mesh>
      {[x0, x1].map((xe) =>
        [Math.PI, Math.PI * 2 - a].map((th) => (
          <mesh
            key={`b${xe}-${th}`}
            material={MATS.casingDark}
            position={[xe, r * Math.sin(th), r * Math.cos(th)]}
            rotation={[th, Math.PI, 0]}
          >
            <boxGeometry args={[0.05, 0.16, 0.1]} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ---------- instanced hex bolts along a flange radius ---------- */
function FlangeBolts({ x, r, count, topOnly = false, phase0 = 0 }) {
  const bolts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const theta0 = topOnly ? A0 : phase0;
        const total = topOnly ? Math.PI - A0 : Math.PI * 2;
        const th = theta0 + ((i + 0.5) / count) * total;
        return [x, (r + 0.05) * Math.sin(th), (r + 0.05) * Math.cos(th), th];
      }),
    [x, r, count, topOnly, phase0]
  );
  return (
    <>
      <Instances limit={count} range={count} geometry={GEO.boltHead} material={MATS.bolt}>
        {bolts.map(([px, py, pz, th], i) => (
          <Instance key={`h${i}`} position={[px - 0.07, py, pz]} rotation={[th, 0, Math.PI / 2]} />
        ))}
      </Instances>
      <Instances limit={count} range={count} geometry={GEO.boltShank} material={MATS.bolt}>
        {bolts.map(([px, py, pz, th], i) => (
          <Instance key={`s${i}`} position={[px + 0.03, py, pz]} rotation={[th, 0, Math.PI / 2]} />
        ))}
      </Instances>
    </>
  );
}
const A0 = 0.9;

/* ---------- lathe profile helper (profile grows from xBase toward front/rear) ---------- */
function Lathe({ profile, xBase, rearward = false, mat, ...props }) {
  const points = useMemo(
    () => profile.map((p) => new THREE.Vector2(p.r, p.y)),
    [profile]
  );
  return (
    <mesh
      material={mat}
      position={[xBase, 0, 0]}
      rotation={[0, 0, rearward ? -Math.PI / 2 : Math.PI / 2]}
      castShadow
      {...props}
    >
      <latheGeometry args={[points, 44]} />
    </mesh>
  );
}

/* ---------- inlet housing: flared lip + guide struts + flange ---------- */
function InletAssembly() {
  return (
    <ExplodePart position={[0, 0, 0]} offset={[-2.75, 0, 0]} delay={0.35}>
      <Lathe
        profile={[
          { r: 1.25, y: 0 }, { r: 1.3, y: 0.2 }, { r: 1.47, y: 0.55 }, { r: 1.55, y: 0.72 },
        ]}
        xBase={-5.15}
        mat={MATS.casing}
      />
      {/* inlet guide vane struts */}
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh
            key={i}
            material={MATS.casingDark}
            position={[-5.42, 0.72 * Math.cos(a), 0.72 * Math.sin(a)]}
            rotation={[a, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.28, 1.0, 0.1]} />
          </mesh>
        );
      })}
      {/* front flange ring + bolt row */}
      <mesh
        material={MATS.casingDark}
        position={[-5.83, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[1.52, 1.52, 0.09, 40, 1, true]} />
      </mesh>
      <FlangeBolts x={-5.83} r={1.5} count={12} phase0={Math.PI / 12} />
    </ExplodePart>
  );
}

/* ---------- nose spinner: explodes forward, spins when assembled ---------- */
function Spinner() {
  const spin = useRotorSpin(2.3);
  return (
    <ExplodePart position={[0, 0, 0]} offset={[-3.2, 0, 0]} delay={0.52}>
      <group ref={spin}>
        <Lathe
          profile={[
            { r: 0.43, y: 0 }, { r: 0.4, y: 0.3 }, { r: 0.17, y: 0.68 }, { r: 0.02, y: 0.86 },
          ]}
          xBase={-4.87}
          mat={MATS.gunmetal}
        />
        <mesh material={MATS.emissive} position={[-5.72, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.035, 12]} />
        </mesh>
      </group>
    </ExplodePart>
  );
}

/* ---------- central shaft + bearing internals (spine stays anchored) ---------- */
function ShaftAssembly() {
  const spin = useRotorSpin(2.3);
  const ballRows = useMemo(() => {
    const mk = (n, rB) =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return [rB * Math.cos(a), rB * Math.sin(a)];
      });
    return { front: mk(11, 0.4), rear: mk(11, 0.44) };
  }, []);
  return (
    <>
      <group ref={spin}>
        <mesh material={MATS.shaft} position={[-1.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.21, 0.21, 9.1, 24]} />
        </mesh>
        {/* split collars either end of the shaft */}
        <mesh material={MATS.discSteel} position={[-5.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.14, 20]} />
        </mesh>
        <mesh material={MATS.discSteel} position={[3.32, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.16, 20]} />
        </mesh>
        {/* inner bearing races riding the shaft */}
        <mesh material={MATS.race} position={[-4.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 20]} />
        </mesh>
        <mesh material={MATS.race} position={[2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.2, 20]} />
        </mesh>
        {/* rolling elements keep orbiting — the bearing reads as operational */}
        {ballRows.front.map(([sy, sz], i) => (
          <mesh key={`fb${i}`} material={MATS.race} position={[-4.9, sy, sz]}>
            <sphereGeometry args={[0.058, 10, 10]} />
          </mesh>
        ))}
        {ballRows.rear.map(([sy, sz], i) => (
          <mesh key={`rb${i}`} material={MATS.race} position={[2.5, sy, sz]}>
            <sphereGeometry args={[0.058, 10, 10]} />
          </mesh>
        ))}
      </group>
      {/* collar halves lift clear of the shaft when exploded */}
      <ExplodePart position={[-5.42, 0, 0]} offset={[0, 0.6, 0]} delay={0.5}>
        <mesh material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 6]} />
        </mesh>
      </ExplodePart>
      <ExplodePart position={[3.32, 0, 0]} offset={[0, 0.6, 0]} delay={0.56}>
        <mesh material={MATS.bolt} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.1, 6]} />
        </mesh>
      </ExplodePart>
    </>
  );
}

/* ---------- outer bearing races (lift radially off the shaft) ---------- */
function BearingOuter({ x, geo, delay = 0.1 }) {
  return (
    <ExplodePart position={[x, 0, 0]} offset={[0, 0.95, 0]} delay={delay}>
      <mesh geometry={geo} material={MATS.race} rotation={[0, Math.PI / 2, 0]} castShadow />
    </ExplodePart>
  );
}

/* ---------- combustion chamber: 6 flame cans + fuel manifold ---------- */
function Combustor() {
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffb066", transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    []
  );
  const cans = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), []);
  useFrame(() => {
    const { p } = cycleState(sim.time);
    const f = (1 - 0.85 * p) * (0.75 + 0.25 * Math.sin(sim.time * 5.2));
    glow.opacity = Math.max(0, 0.85 * f);
  });
  return (
    <ExplodePart position={[0, 0, 0]} offset={[1.9, 0, 0]} delay={0.45}>
      {/* fuel manifold ring */}
      <mesh material={MATS.brass} position={[-0.42, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[1.05, 0.048, 10, 48]} />
      </mesh>
      {/* fuel injectors (radial: manifold → can heads) */}
      {cans.map((a, i) => (
        <mesh
          key={`inj${i}`}
          material={MATS.brass}
          position={[-0.85, 1.0 * Math.cos(a), 1.0 * Math.sin(a)]}
          rotation={[a, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.055, 0.075, 0.4, 10]} />
        </mesh>
      ))}
      {/* flame cans + glowing front faces */}
      {cans.map((a, i) => (
        <group key={`can${i}`}>
          <mesh
            material={MATS.can}
            position={[-0.5, 0.95 * Math.cos(a), 0.95 * Math.sin(a)]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.27, 0.27, 1.05, 20]} />
          </mesh>
          <mesh
            material={glow}
            position={[-1.04, 0.95 * Math.cos(a), 0.95 * Math.sin(a)]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <circleGeometry args={[0.2, 18]} />
          </mesh>
        </group>
      ))}
    </ExplodePart>
  );
}

/* ---------- exhaust assembly: nozzle, hot cone, struts, flange ---------- */
function ExhaustAssembly() {
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff7a3c", transparent: true, opacity: 0.55,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    []
  );
  useFrame(() => {
    const { p } = cycleState(sim.time);
    const f = (1 - 0.85 * p) * (0.75 + 0.25 * Math.sin(sim.time * 4.1 + 1.7));
    glow.opacity = Math.max(0, 0.55 * f);
  });
  return (
    <ExplodePart position={[0, 0, 0]} offset={[3.9, 0, 0]} delay={0.5}>
      {/* converging nozzle */}
      <Lathe
        rearward
        profile={[
          { r: 0.98, y: 0 }, { r: 0.95, y: 0.5 }, { r: 0.9, y: 1.2 }, { r: 0.92, y: 1.55 },
        ]}
        xBase={3.35}
        mat={MATS.casing}
      />
      {/* inner rear cone */}
      <Lathe
        rearward
        profile={[
          { r: 0.55, y: 0 }, { r: 0.3, y: 0.75 }, { r: 0.1, y: 1.3 }, { r: 0.02, y: 1.4 },
        ]}
        xBase={3.62}
        mat={MATS.casingDark}
      />
      {/* exhaust guide struts */}
      {Array.from({ length: 3 }, (_, i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh
            key={i}
            material={MATS.casingDark}
            position={[3.8, 0.58 * Math.cos(a), 0.58 * Math.sin(a)]}
            rotation={[a, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.5, 0.6, 0.09]} />
          </mesh>
        );
      })}
      {/* rear flange + bolts */}
      <mesh
        material={MATS.casingDark}
        position={[4.92, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.94, 0.94, 0.08, 36, 1, true]} />
      </mesh>
      <FlangeBolts x={4.92} r={0.9} count={8} phase0={Math.PI / 8} />
      {/* hot-face glow disc */}
      <mesh material={glow} position={[4.62, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <ringGeometry args={[0.12, 0.5, 28]} />
      </mesh>
    </ExplodePart>
  );
}

/* ---------- static set-dressing: mounting rings, brackets, pylons ---------- */
function MountRings() {
  return (
    <>
      {[
        [-5.62, 1.44], [-1.38, 1.44], [0.48, 1.56], [3.32, 1.52],
      ].map(([x, r]) => (
        <mesh
          key={x}
          material={MATS.casingDark}
          position={[x, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[r, 0.05, 10, 60]} />
        </mesh>
      ))}
    </>
  );
}

function SupportBrackets() {
  return (
    <>
      {[
        [-4.9, 0.7], [2.5, 0.72],
      ].map(([x, hh], i) => (
        <mesh key={i} material={MATS.gunmetal} position={[x, -0.62 - hh / 2, 0]} castShadow>
          <boxGeometry args={[0.26, hh, 0.2]} />
        </mesh>
      ))}
    </>
  );
}

function Pylons() {
  return [-3.4, 1.9].map((x) => (
    <group key={x}>
      <mesh material={MATS.gunmetal} position={[x, -2.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 1.95, 0.32]} />
      </mesh>
      <mesh material={MATS.gunmetal} position={[x, -3.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.14, 0.5]} />
      </mesh>
      <mesh material={MATS.emissive} position={[x, -1.38, 0.17]}>
        <boxGeometry args={[0.3, 0.03, 0.02]} />
      </mesh>
    </group>
  ));
}

/* ============================================================
   FULL ENGINE ASSEMBLY
   ============================================================ */
export function EngineAssembly() {
  return (
    <group>
      {/* COMPRESSOR CASING (wedge cutaway, top half explodes) */}
      <CasingAssembly xSpan={[-5.55, -1.3]} r={1.34} delay={0.6}>
        <StatorRing x={-4.42} />
        <StatorRing x={-3.77} />
        <StatorRing x={-3.12} />
        <FlangeBolts x={-5.5} r={1.34} count={6} topOnly />
        <FlangeBolts x={-1.35} r={1.34} count={6} topOnly />
      </CasingAssembly>

      {/* COMBUSTOR HOUSING */}
      <CasingAssembly xSpan={[-1.25, 0.4]} r={1.5} a={0.95} mat={MATS.casingDark} delay={0.62}>
        <FlangeBolts x={-1.2} r={1.5} count={5} topOnly />
        <FlangeBolts x={0.35} r={1.5} count={5} topOnly />
      </CasingAssembly>

      {/* TURBINE CASING */}
      <CasingAssembly xSpan={[0.5, 3.3]} r={1.42} delay={0.62}>
        <StatorRing x={0.45} geo={NGV_GEO} rMid={1.145} count={13} tilt={0.3} />
        <FlangeBolts x={0.55} r={1.42} count={6} topOnly />
        <FlangeBolts x={3.25} r={1.42} count={6} topOnly />
      </CasingAssembly>

      {/* STRUCTURE */}
      <MountRings />
      <SupportBrackets />
      <Pylons />

      {/* INLET + SPINNER */}
      <InletAssembly />
      <Spinner />

      {/* COMPRESSOR ROTOR STAGES — slides forward, stays clear of inlet */}
      <RotorStage x={-4.75} dx={-0.7} delay={0.2} count={16} rDisc={0.82} discW={0.15}
        rMid={1.07} bladeLen={0.5} chord={0.2} thick={0.035} tilt={0.42} phase={0.3} />
      <RotorStage x={-4.1} dx={-1.95} delay={0.28} count={16} rDisc={0.82} discW={0.15}
        rMid={1.07} bladeLen={0.5} chord={0.2} thick={0.035} tilt={0.42} phase={1.1} />
      <RotorStage x={-3.45} dx={-3.2} delay={0.36} count={16} rDisc={0.82} discW={0.15}
        rMid={1.07} bladeLen={0.5} chord={0.2} thick={0.035} tilt={0.42} phase={2.2} />
      <RotorStage x={-2.8} dx={-4.45} delay={0.44} count={16} rDisc={0.82} discW={0.15}
        rMid={1.07} bladeLen={0.5} chord={0.2} thick={0.035} tilt={0.42} phase={2.9} />

      {/* SHAFT + BEARINGS */}
      <ShaftAssembly />
      <BearingOuter x={-4.9} geo={RACE_F} delay={0.12} />
      <BearingOuter x={2.5} geo={RACE_R} delay={0.16} />

      {/* COMBUSTION CHAMBER */}
      <Combustor />

      {/* TURBINE ROTOR STAGES — slides rearward, different rotor speed */}
      <RotorStage x={0.9} dx={2.4} delay={0.3} count={13} rDisc={0.9} discW={0.18}
        rMid={1.12} bladeLen={0.44} chord={0.3} thick={0.055} tilt={-0.55}
        speed={1.7} phase={0.8} />
      <RotorStage x={1.65} dx={4.6} delay={0.38} count={13} rDisc={0.9} discW={0.18}
        rMid={1.12} bladeLen={0.44} chord={0.3} thick={0.055} tilt={-0.55}
        speed={1.7} phase={2.4} />

      {/* EXHAUST */}
      <ExhaustAssembly />
    </group>
  );
}
