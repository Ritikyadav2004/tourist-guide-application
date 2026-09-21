import { useEffect, useState, useRef } from "react";

const AnimatedCounter = ({ end, duration = 1000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);
  const endRef = useRef(end);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  useEffect(() => {
    if (!end) return;

    let observer;
    let animationFrameId;

    const startAnimation = () => {
      let startTime = null;
      const startValue = 0;
      const targetValue = endRef.current;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function: easeOutExpo (starts fast, slows down gradually)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentValue = Math.floor(easeProgress * targetValue);
        
        setCount(currentValue);

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(animate);
        } else {
          setCount(targetValue);
        }
      };

      animationFrameId = window.requestAnimationFrame(animate);
    };

    if (hasAnimated.current) {
      startAnimation();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          startAnimation();
          hasAnimated.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration]);

  return (
    <span ref={elementRef}>
      {end ? count : 0}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
