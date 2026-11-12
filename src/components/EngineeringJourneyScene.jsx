/* eslint-disable react/prop-types */
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import "./EngineeringJourneyScene.css";

const desktopPath =
  "M 445 650 C 560 650 700 650 820 650 C 900 650 930 690 900 735 C 875 775 900 785 930 790";
const mobilePath =
  "M 38 94 C 132 66 260 65 300 102 C 330 130 280 175 310 220";

function Runner() {
  return (
    <g className="journey-runner" data-journey-runner>
      <path className="journey-runner__trail" d="M -7 -8 C -21 -12 -30 -12 -42 -18" />
      <path className="journey-runner__trail journey-runner__trail--fine" d="M -6 -4 C -19 -5 -25 -5 -34 -8" />
      <ellipse className="journey-runner__contact" cx="0" cy="3" rx="14" ry="3" />
      <g className="journey-runner__body">
        <path className="journey-runner__torso-glow" d="M 1 -44 L -5 -27" />
        <path className="journey-runner__torso" d="M 1 -44 L -5 -27" />
        <circle className="journey-runner__head" cx="3" cy="-52" r="5.3" />
        <g className="journey-runner__arm journey-runner__arm--rear">
          <path d="M 0 -41 L -10 -32" />
          <g className="journey-runner__forearm journey-runner__forearm--rear">
            <path d="M -10 -32 L -17 -39" />
          </g>
        </g>
        <g className="journey-runner__arm journey-runner__arm--front">
          <path d="M 1 -41 L 11 -33" />
          <g className="journey-runner__forearm journey-runner__forearm--front">
            <path d="M 11 -33 L 17 -24" />
          </g>
        </g>
        <g className="journey-runner__leg journey-runner__leg--rear">
          <path d="M -5 -27 L -14 -14" />
          <circle cx="-14" cy="-14" r="2.2" />
          <g className="journey-runner__shin journey-runner__shin--rear">
            <path d="M -14 -14 L -18 -3 L -28 -2" />
          </g>
        </g>
        <g className="journey-runner__leg journey-runner__leg--front">
          <path d="M -5 -27 L 7 -14" />
          <circle cx="7" cy="-14" r="2.2" />
          <g className="journey-runner__shin journey-runner__shin--front">
            <path d="M 7 -14 L 13 -4 L 23 -4" />
          </g>
        </g>
        <path className="journey-runner__torso-detail" d="M -1 -39 L -4 -31" />
      </g>
    </g>
  );
}

function RouteMap({ path, viewBox, variant }) {
  const routeId = `journey-route-${variant}`;

  return (
    <svg
      className={`engineering-journey__route engineering-journey__route--${variant}`}
      data-journey-route
      data-route-variant={variant}
      viewBox={viewBox}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${routeId}-gradient`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="58%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <radialGradient id={`${routeId}-node`}>
          <stop offset="0%" stopColor="#e0fbff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#67e8f9" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path className="journey-route__rail journey-route__rail--wide" d={path} />
      <path className="journey-route__rail journey-route__rail--base" d={path} />
      <path className="journey-route__rail journey-route__rail--fine" d={path} />
      <path className="journey-route__draw" d={path} data-journey-track />
      <path className="journey-route__flow" d={path} />

      <path
        className="journey-route__detail"
        d={variant === "desktop" ? "M 445 666 L 820 666" : "M 38 108 C 132 80 260 79 300 116"}
      />
      <path
        className="journey-route__detail journey-route__detail--purple"
        d={variant === "desktop" ? "M 445 634 L 820 634" : "M 38 80 C 132 52 260 51 300 88"}
      />

      <g className="journey-route__marker journey-route__marker--start" transform={variant === "desktop" ? "translate(445 650)" : "translate(38 94)"}>
        <circle r="20" fill={`url(#${routeId}-node)`} />
        <circle className="journey-route__marker-ring" r="9" />
        <circle className="journey-route__marker-core" r="2.5" />
      </g>
      <g className="journey-route__marker journey-route__marker--end" transform={variant === "desktop" ? "translate(930 790)" : "translate(310 220)"}>
        <circle r="25" fill={`url(#${routeId}-node)`} />
        <circle className="journey-route__marker-ring" r="11" />
        <circle className="journey-route__marker-core" r="3" />
      </g>

      <g className="journey-route__calibration">
        {(
          variant === "desktop"
            ? [[590, 650], [700, 650], [900, 670], [885, 757]]
            : [[115, 77], [192, 68], [301, 104], [326, 162]]
        ).map(([x, y], index) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <circle r="7" />
            <path d="M -11 0 H -7 M 7 0 H 11 M 0 -11 V -7 M 0 7 V 11" />
            {index % 2 === 0 && <circle className="journey-route__calibration-core" r="1.5" />}
          </g>
        ))}
      </g>

      <circle className="journey-route__particle" r="2.2">
        <animateMotion dur="4.8s" repeatCount="indefinite" path={path} />
      </circle>
      <circle className="journey-route__particle journey-route__particle--violet" r="1.6">
        <animateMotion dur="6.4s" begin="-2.7s" repeatCount="indefinite" path={path} />
      </circle>

      <Runner />
    </svg>
  );
}

export default function EngineeringJourneyScene({ reducedMotion }) {
  const sceneRef = useRef(null);

  useGSAP(
    (_, contextSafe) => {
      const scene = sceneRef.current;
      const layout = scene?.closest("[data-journey-layout]");
      if (!scene || !layout) return;

      const routes = [...scene.querySelectorAll("[data-journey-route]")].map(
        (svg) => ({
          svg,
          path: svg.querySelector("[data-journey-track]"),
          runner: svg.querySelector("[data-journey-runner]"),
        })
      );
      const milestones = [...layout.querySelectorAll("[data-journey-info]")];
      const positionRunner = (route, progress) => {
        const totalLength = route.path.getTotalLength();
        const distance = totalLength * progress;
        const point = route.path.getPointAtLength(distance);
        const before = route.path.getPointAtLength(Math.max(0, distance - 1));
        const after = route.path.getPointAtLength(
          Math.min(totalLength, distance + 1)
        );
        const angle =
          (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;

        gsap.set(route.runner, {
          attr: { transform: `translate(${point.x} ${point.y}) rotate(${angle})` },
        });
      };

      routes.forEach((route) => {
        const length = route.path.getTotalLength();
        gsap.set(route.path, {
          strokeDasharray: length,
          strokeDashoffset: reducedMotion ? 0 : length,
        });
      });

      if (reducedMotion) {
        milestones.forEach((milestone) =>
          gsap.set(milestone, { autoAlpha: 1, y: 0 })
        );
        routes.forEach((route) => {
          positionRunner(route, 1);
          gsap.set(route.runner, { autoAlpha: 1 });
        });
        return;
      }

      gsap.set(milestones, { autoAlpha: 0, y: 18 });
      routes.forEach((route) => gsap.set(route.runner, { autoAlpha: 0 }));

      const progress = { value: 0 };
      const story = gsap.timeline({ paused: true });

      story
        .fromTo(
          milestones[0],
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" },
          0
        )
        .to(
          routes.map((route) => route.path),
          { strokeDashoffset: 0, duration: 2.5, ease: "power2.inOut" },
          0.25
        )
        .to(
          routes.map((route) => route.runner),
          { autoAlpha: 1, duration: 0.3, ease: "power1.out" },
          2.4
        )
        .to(
          progress,
          {
            value: 1,
            duration: 7.8,
            ease: "power2.inOut",
            onUpdate: () =>
              routes.forEach((route) => positionRunner(route, progress.value)),
          },
          2.7
        )
        .fromTo(
          milestones[1],
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" },
          9.8
        )
        .to(
          scene.querySelectorAll(".journey-route__marker--end"),
          { scale: 1.35, duration: 0.65, yoyo: true, repeat: 1, ease: "power2.inOut" },
          10.4
        );

      const playStory = contextSafe(() => story.play());
      const trigger = ScrollTrigger.create({
        trigger: layout,
        start: "top 76%",
        once: true,
        onEnter: playStory,
      });

      return () => {
        trigger.kill();
        story.kill();
      };
    },
    { scope: sceneRef, dependencies: [reducedMotion], revertOnUpdate: true }
  );

  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className="engineering-journey__scene"
      data-reduced-motion={reducedMotion ? "true" : undefined}
      data-journey-scene
    >
      <RouteMap path={desktopPath} viewBox="0 0 1000 1120" variant="desktop" />
      <RouteMap path={mobilePath} viewBox="0 0 360 250" variant="mobile" />
    </div>
  );
}
