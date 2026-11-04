import { useEffect, useRef, useState } from "react";
import { OrbitingCircles } from "./OrbitingCircles";

export function Frameworks() {
  const skills = [
    "ansys.svg",
    "autocad.svg",
    "creo.svg",
    "FreeCAD.svg",
    "fusion.svg",
    "onshape.svg",
    "Python-logo.svg",
    "Siemens-NX.svg",
    "soildedge.svg",
     "Matlab.svg",
    "soildworkslogo.svg",
  ];

  // Measure the box the wheel lives in, so the orbit always rotates around
  // THIS container's centre and stays fully inside it (never overflows the
  // text header above, never gets clipped at tile edges).
  const wheelRef = useRef(null);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize(Math.min(rect.width, rect.height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const outerIconSize = Math.min(40, Math.max(16, Math.round(size * 0.15)));
  const innerIconSize = Math.min(26, Math.max(10, Math.round(outerIconSize * 0.62)));

  // Radius keeps every logo fully inside this container at any screen size.
  const clear = Math.round(size / 2) - 4;
  const outerRadius = Math.max(20, clear - Math.round(outerIconSize / 2));
  // Inner ring sits just inside the outer ring's logos, no collisions.
  const innerRadius = Math.max(
    Math.round(outerRadius * 0.5),
    outerRadius - Math.round(outerIconSize / 2) - Math.round(innerIconSize / 2) - 4
  );

  return (
    <div
      ref={wheelRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* Outer Ring */}
      <OrbitingCircles iconSize={outerIconSize} radius={outerRadius}>
        {skills.map(renderIcon)}
      </OrbitingCircles>

      {/* Inner Ring (Reversed) */}
      <OrbitingCircles iconSize={innerIconSize} radius={innerRadius} reverse speed={2}>
        {[...skills].reverse().map(renderIcon)}
      </OrbitingCircles>
    </div>
  );
}

function renderIcon(skill, index) {
  return (
    <img
      key={index}
      src={`/assets/logos/${skill}`}
      alt=""
      className="duration-200 rounded-sm hover:scale-110 object-contain"
      onError={(event) => (event.currentTarget.style.display = "none")}
    />
  );
}
