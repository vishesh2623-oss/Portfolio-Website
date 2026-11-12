/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const createTube = (curve, radius, radialSegments = 7) =>
  new THREE.TubeGeometry(curve, 160, radius, radialSegments, false);

function createRoute(milestoneCount, compact, reducedMotion) {
  const count = Math.max(milestoneCount, 2);
  const positions = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    return compact
      ? new THREE.Vector3(
          Math.sin(progress * Math.PI * 2) * 0.12,
          THREE.MathUtils.lerp(1.05, -1.05, progress),
          0
        )
      : new THREE.Vector3(
          THREE.MathUtils.lerp(-2.25, 2.25, progress),
          Math.sin(progress * Math.PI) * 0.16,
          THREE.MathUtils.lerp(1.25, -1.25, progress)
        );
  });

  const routePoints = [];
  positions.forEach((position, index) => {
    routePoints.push(position.clone().add(new THREE.Vector3(0, 0, -0.22)));
    if (index < positions.length - 1) {
      const next = positions[index + 1];
      const midpoint = position.clone().lerp(next, 0.5);
      if (compact) {
        midpoint.x += index % 2 === 0 ? 0.3 : -0.3;
      } else {
        midpoint.y += index % 2 === 0 ? 0.3 : -0.3;
      }
      midpoint.z -= 0.35;
      routePoints.push(midpoint);
    }
  });

  const curve = new THREE.CatmullRomCurve3(
    routePoints,
    false,
    "catmullrom",
    0.45
  );
  const base = createTube(curve, 0.052, 8);
  const main = createTube(curve, 0.034, 8);
  const streams = [-1, 1].map((direction) => {
    const offset = compact
      ? new THREE.Vector3(direction * 0.12, 0, -0.08)
      : new THREE.Vector3(0, direction * 0.12, -0.08);
    const streamCurve = new THREE.CatmullRomCurve3(
      routePoints.map((point) => point.clone().add(offset)),
      false,
      "catmullrom",
      0.45
    );
    return createTube(streamCurve, 0.013, 6);
  });

  const mainIndexCount = main.index?.count ?? main.attributes.position.count;
  main.setDrawRange(0, reducedMotion ? mainIndexCount : 0);
  streams.forEach((geometry) => {
    const indexCount = geometry.index?.count ?? geometry.attributes.position.count;
    geometry.setDrawRange(0, indexCount);
  });

  return { base, curve, main, positions, streams };
}

function drawGeometry(geometry, progress) {
  const total = geometry.index?.count ?? geometry.attributes.position.count;
  const triangles = Math.floor((total * clamp01(progress)) / 3);
  geometry.setDrawRange(0, triangles * 3);
}

function MechanicalHub({
  index,
  position,
  progressRef,
  entryRef,
  highlightedRef,
  compact,
  reducedMotion,
  milestoneCount,
}) {
  const root = useRef(null);
  const outerRotor = useRef(null);
  const innerRotor = useRef(null);
  const coreRotor = useRef(null);
  const outerMaterial = useRef(null);
  const innerMaterial = useRef(null);
  const accentMaterial = useRef(null);
  const activation = useRef(index === 0 ? 1 : 0);
  const tickCount = compact ? 12 : 18;
  const ticks = useMemo(
    () => Array.from({ length: tickCount }, (_, tick) => (tick / tickCount) * Math.PI * 2),
    [tickCount]
  );

  useFrame((_, delta) => {
    if (reducedMotion) return;

    const progress = progressRef.current.value * (milestoneCount - 1);
    const focus = highlightedRef.current;
    const targetActivation =
      focus === null
        ? clamp01(1 - Math.abs(progress - index) / 1.12)
        : focus === index
          ? 1
          : 0.18;

    activation.current = THREE.MathUtils.damp(
      activation.current,
      targetActivation,
      3.6,
      delta
    );

    const assembly = entryRef.current.value;
    const emphasis = activation.current;
    root.current.scale.setScalar((compact ? 0.72 : 1) * (0.76 + assembly * 0.24));
    root.current.position.z = position[2] + (1 - assembly) * 0.3;
    outerRotor.current.rotation.z += delta * (index % 2 === 0 ? 0.12 : -0.1);
    innerRotor.current.rotation.z -= delta * (index % 2 === 0 ? 0.19 : -0.16);
    coreRotor.current.rotation.z += delta * (index % 2 === 0 ? -0.08 : 0.1);
    outerMaterial.current.opacity = assembly * (0.24 + emphasis * 0.62);
    innerMaterial.current.opacity = assembly * (0.18 + emphasis * 0.52);
    accentMaterial.current.opacity = assembly * (0.22 + emphasis * 0.65);
  });

  return (
    <group ref={root} position={position} scale={compact ? 0.72 : 1}>
      <mesh>
        <circleGeometry args={[1.24, 48]} />
        <meshBasicMaterial
          color="#0b1c2b"
          transparent
          opacity={reducedMotion ? 0.52 : 0.36}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.16, 1.16, 0.38, 40, 1, true]} />
        <meshStandardMaterial
          color="#173449"
          emissive="#0a2133"
          emissiveIntensity={0.45}
          metalness={0.84}
          roughness={0.36}
          side={THREE.DoubleSide}
          transparent
          opacity={reducedMotion ? 0.76 : 0.62}
        />
      </mesh>
      <mesh position={[0, 0, -0.36]}>
        <torusGeometry args={[1.16, 0.038, 8, 72]} />
        <meshStandardMaterial
          color="#3c6178"
          metalness={0.82}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <torusGeometry args={[1.16, 0.032, 8, 72]} />
        <meshStandardMaterial
          color="#5e91a9"
          emissive="#12354a"
          emissiveIntensity={0.5}
          metalness={0.78}
          roughness={0.32}
        />
      </mesh>
      {ticks.map((angle) => (
        <mesh
          key={`cage-${angle}`}
          position={[Math.cos(angle) * 1.16, Math.sin(angle) * 1.16, -0.16]}
        >
          <boxGeometry args={[0.045, 0.045, 0.38]} />
          <meshStandardMaterial
            color="#36566c"
            metalness={0.82}
            roughness={0.33}
          />
        </mesh>
      ))}

      <group ref={outerRotor} position={[0, 0, 0.18]} rotation={[0.55, -0.18, 0]}>
        <mesh>
          <torusGeometry args={[1.06, 0.034, 8, 96]} />
          <meshStandardMaterial
            ref={outerMaterial}
            color="#68d9f5"
            emissive="#0e7490"
            emissiveIntensity={0.8}
            metalness={0.72}
            roughness={0.32}
            transparent
            opacity={0.78}
            depthWrite={false}
          />
        </mesh>
        {ticks.map((angle) => (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 1.19, Math.sin(angle) * 1.19, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <boxGeometry args={[0.026, angle % (Math.PI / 2) < 0.02 ? 0.19 : 0.1, 0.025]} />
            <meshBasicMaterial
              color="#82dcf5"
              transparent
              opacity={reducedMotion ? 0.58 : 0.42}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={innerRotor} position={[0, 0, 0.24]} rotation={[-0.48, 0.24, 0.08]}>
        <mesh ref={innerMaterial}>
          <torusGeometry args={[0.78, 0.018, 8, 80]} />
          <meshStandardMaterial
            color="#9d9cfb"
            emissive="#4c3c91"
            emissiveIntensity={0.64}
            metalness={0.64}
            roughness={0.35}
            transparent
            opacity={0.64}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={accentMaterial} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.62, 0.02, 6, 48, Math.PI * 1.35]} />
          <meshBasicMaterial
            color="#a8f3ff"
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI * 0.84]}>
          <torusGeometry args={[0.49, 0.012, 6, 40, Math.PI * 0.72]} />
          <meshBasicMaterial
            color="#80bbff"
            transparent
            opacity={reducedMotion ? 0.56 : 0.38}
            depthWrite={false}
          />
        </mesh>
      </group>

      <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.39, 0.39, 0.1, 32]} />
        <meshStandardMaterial
          color="#18364a"
          emissive="#0d2940"
          emissiveIntensity={0.42}
          metalness={0.82}
          roughness={0.3}
        />
      </mesh>
      <group ref={coreRotor} position={[0, 0, 0.1]}>
        {ticks.slice(0, 8).map((angle) => (
          <mesh key={angle} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial
              color="#7994a8"
              metalness={0.82}
              roughness={0.3}
            />
          </mesh>
        ))}
        {ticks.slice(0, compact ? 8 : 12).map((angle, toothIndex) => (
          <mesh
            key={`tooth-${toothIndex}`}
            position={[Math.cos(angle) * 0.35, Math.sin(angle) * 0.35, 0.035]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.08, 0.055, 0.055]} />
            <meshStandardMaterial
              color="#7395aa"
              metalness={0.84}
              roughness={0.28}
            />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.12, 20, 20]} />
          <meshStandardMaterial
            color="#b4f1ff"
            emissive="#35b8dd"
            emissiveIntensity={0.72}
            metalness={0.48}
            roughness={0.22}
          />
        </mesh>
      </group>

      <mesh position={[0.92, 0.62, 0.08]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#d5faff" />
      </mesh>
      <mesh position={[-0.88, -0.56, 0.08]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#89c8ff" />
      </mesh>
      <pointLight
        position={[0, 0, 0.35]}
        color="#48cbed"
        intensity={0.48}
        distance={2.2}
        decay={2}
      />
    </group>
  );
}

function EnergyPulse({ index, route, progressRef, entryRef, pulseRefs }) {
  const material = useRef(null);
  const position = useRef(new THREE.Vector3());

  useFrame((state) => {
    const pulse = pulseRefs.current[index];
    if (!pulse || !material.current) return;

    const entry = entryRef.current.value;
    const travel =
      (state.clock.elapsedTime * 0.045 +
        progressRef.current.value * 0.34 +
        index / 3) %
      1;
    route.curve.getPointAt(travel, position.current);
    pulse.position.copy(position.current);
    pulse.scale.setScalar(0.45 + entry * 0.55);
    material.current.opacity = entry * (0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.16);
  });

  return (
    <mesh
      ref={(element) => {
        pulseRefs.current[index] = element;
      }}
    >
      <sphereGeometry args={[index === 0 ? 0.07 : 0.05, 10, 10]} />
      <meshBasicMaterial
        ref={material}
        color={index === 1 ? "#a5b4fc" : "#c8faff"}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

function JourneyWorld({
  progressRef,
  entryRef,
  highlightedRef,
  reducedMotion,
  milestoneCount,
}) {
  const { camera, size } = useThree();
  const compact = size.width < 768;
  const pulseRefs = useRef([]);
  const route = useMemo(
    () => createRoute(milestoneCount, compact, reducedMotion),
    [milestoneCount, compact, reducedMotion]
  );
  const supports = useMemo(
    () => Array.from({ length: 5 }, (_, index) => route.curve.getPointAt(0.18 + index * 0.16)),
    [route]
  );

  useFrame((state, delta) => {
    if (reducedMotion) return;

    const progress = progressRef.current.value;
    const stage = progress * (route.positions.length - 1);
    const index = Math.min(Math.floor(stage), route.positions.length - 2);
    const localProgress = stage - index;
    const target = route.positions[index]
      .clone()
      .lerp(route.positions[index + 1], localProgress);
    const sway = Math.sin(progress * Math.PI) * 0.12;

    if (compact) {
      const viewTargetY = target.y * 0.1;
      camera.position.x += (2.2 + sway - camera.position.x) * Math.min(delta * 2.4, 1);
      camera.position.y += (viewTargetY + 0.45 - camera.position.y) * Math.min(delta * 2.4, 1);
      camera.position.z += (8.4 - camera.position.z) * Math.min(delta * 2.4, 1);
      camera.lookAt(sway * 0.45, viewTargetY, 0);
    } else {
      camera.position.x += (target.x * 0.62 + 0.3 - camera.position.x) * Math.min(delta * 2.2, 1);
      camera.position.y += (1.85 + sway - camera.position.y) * Math.min(delta * 2.2, 1);
      camera.position.z += (target.z + 7.6 - camera.position.z) * Math.min(delta * 2.2, 1);
      camera.lookAt(target.x, target.y, target.z);
    }

    const entry = entryRef.current.value;
    const routeProgress = entry * (0.26 + progress * 0.74);
    drawGeometry(route.main, routeProgress);
  });

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight
        position={[-3, 5, 7]}
        color="#d9f5ff"
        intensity={1.05}
      />
      <pointLight
        position={[0, 0, 4]}
        color="#34b5d8"
        intensity={1.8}
        distance={12}
        decay={2}
      />

      <mesh geometry={route.base}>
        <meshStandardMaterial
          color="#183449"
          emissive="#092339"
          emissiveIntensity={0.42}
          metalness={0.7}
          roughness={0.38}
        />
      </mesh>
      {supports.map((point, index) => (
        <mesh
          key={index}
          position={[point.x, point.y, point.z + 0.04]}
          rotation={[0, 0, compact ? Math.PI / 2 : 0]}
        >
          <boxGeometry args={compact ? [0.34, 0.045, 0.06] : [0.045, 0.34, 0.06]} />
          <meshStandardMaterial
            color="#42647a"
            emissive="#12344c"
            emissiveIntensity={0.5}
            metalness={0.74}
            roughness={0.34}
          />
        </mesh>
      ))}
      {route.streams.map((stream, index) => (
        <mesh key={index} geometry={stream}>
          <meshBasicMaterial
            color={index === 0 ? "#52c8e8" : "#8e8cdd"}
            transparent
            opacity={reducedMotion ? 0.34 : 0.26}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh geometry={route.main}>
        <meshBasicMaterial
          color="#a4f3ff"
          transparent
          opacity={reducedMotion ? 0.92 : 0.88}
          toneMapped={false}
        />
      </mesh>

      {route.positions.map((position, index) => (
        <MechanicalHub
          key={index}
          index={index}
          position={[position.x, position.y, position.z]}
          progressRef={progressRef}
          entryRef={entryRef}
          highlightedRef={highlightedRef}
          compact={compact}
          reducedMotion={reducedMotion}
          milestoneCount={milestoneCount}
        />
      ))}

      {!reducedMotion &&
        Array.from({ length: 3 }, (_, index) => (
          <EnergyPulse
            key={index}
            index={index}
            route={route}
            progressRef={progressRef}
            entryRef={entryRef}
            pulseRefs={pulseRefs}
          />
        ))}
    </>
  );
}

export default function EngineeringJourneyScene({
  active,
  entryRef,
  highlightedRef,
  milestoneCount,
  progressRef,
  reducedMotion,
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      data-journey-scene
    >
      <Canvas
        camera={{ position: [0, 0, 7.9], fov: 34, zoom: 1.22 }}
        className="pointer-events-none"
        dpr={[1, 1.5]}
        frameloop={active && !reducedMotion ? "always" : "demand"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <JourneyWorld
          entryRef={entryRef}
          highlightedRef={highlightedRef}
          milestoneCount={milestoneCount}
          progressRef={progressRef}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
