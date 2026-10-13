"use client";

import { useEffect } from "react";

/** One observer, one entrance per element; all animation work stays in the browser. */
export function SectionMotion() {
  useEffect(() => {
    const root = document.querySelector("[data-landing]");
    if (!root || !window.IntersectionObserver || !Element.prototype.animate)
      return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const played = new WeakSet<Element>();
    const active = new Set<Animation>();
    let observer: IntersectionObserver | undefined;

    const setup = () => {
      observer?.disconnect();
      for (const animation of active) animation.cancel();
      active.clear();
      if (preference.matches) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || played.has(entry.target)) continue;
            const element = entry.target as HTMLElement;
            played.add(element);
            observer?.unobserve(element);
            const entrances: Record<string, string> = {
              rise: "translateY(24px)",
              tilt: "perspective(1000px) translateY(28px) rotateX(7deg)",
              slide: "translateX(-20px)",
              scale: "translateY(12px) scale(0.96)",
            };
            const start =
              entrances[element.dataset.reveal || "rise"] || entrances.rise;
            const animation = element.animate(
              [
                { opacity: 0.7, transform: start },
                { opacity: 1, transform: "none" },
              ],
              {
                duration: 650,
                delay:
                  Math.min(Number(element.dataset.motionOrder || 0), 5) * 75,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "backwards",
              },
            );
            active.add(animation);
            animation.onfinish = () => active.delete(animation);
          }
        },
        { threshold: 0.12 },
      );

      root.querySelectorAll("[data-reveal]").forEach((element) => {
        if (!played.has(element)) observer?.observe(element);
      });
    };

    setup();
    preference.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", setup);
      for (const animation of active) animation.cancel();
    };
  }, []);

  return null;
}
