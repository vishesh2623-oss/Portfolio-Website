import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { ScrollTrigger } from "../lib/gsap.js";

const LenisScrollTriggerSync = () => {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const updateScrollTrigger = () => ScrollTrigger.update(true);
    lenis.on("scroll", updateScrollTrigger);

    return () => lenis.off("scroll", updateScrollTrigger);
  }, [lenis]);

  return null;
};

export default LenisScrollTriggerSync;
