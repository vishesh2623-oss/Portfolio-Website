/* eslint-disable react/prop-types */
import { motion, useReducedMotion } from "motion/react";

const Reveal = ({
  as = "div",
  children,
  className,
  delay = 0,
  y = 18,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const MotionElement = motion[as];

  return (
    <MotionElement
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.7,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...props}
    >
      {children}
    </MotionElement>
  );
};

export default Reveal;
