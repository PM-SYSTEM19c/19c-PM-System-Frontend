"use client";

import { Check, GitBranch, Layers3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./workflow-3d.module.css";

const stages = [
  {
    name: "Plan",
    team: "Project Manager",
    task: "Define the next milestone",
    icon: Layers3,
    status: "Ready",
    progress: 100,
  },
  {
    name: "Build",
    team: "Internal Team",
    task: "Bring the deliverables to life",
    icon: GitBranch,
    status: "In progress",
    progress: 68,
  },
  {
    name: "Deliver",
    team: "Client",
    task: "Review approved progress",
    icon: Check,
    status: "Visible",
    progress: 42,
  },
];

export function Workflow3D() {
  const region = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting && !document.hidden);
      },
      { threshold: 0.15 },
    );
    if (region.current) observer.observe(region.current);
    const updateVisibility = () => {
      const bounds = region.current?.getBoundingClientRect();
      setVisible(
        !document.hidden &&
          !!bounds &&
          bounds.bottom > 0 &&
          bounds.top < window.innerHeight,
      );
    };
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const running = visible && !reducedMotion;

  return (
    <div ref={region} className={styles.region}>
      <div
        className={styles.stage}
        onPointerMove={(event) => {
          if (!running || event.pointerType !== "mouse") return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => {
            scene.current?.style.setProperty("--tilt-x", `${-y * 8}deg`);
            scene.current?.style.setProperty("--tilt-y", `${x * 10}deg`);
          });
        }}
        onPointerLeave={() => {
          cancelAnimationFrame(frame.current);
          scene.current?.style.setProperty("--tilt-x", "0deg");
          scene.current?.style.setProperty("--tilt-y", "0deg");
        }}
      >
        <div ref={scene} className={styles.scene} data-running={running}>
          <div className={styles.float}>
            <div className={styles.foundation} aria-hidden="true" />
            <svg
              className={styles.connections}
              viewBox="0 0 560 260"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M85 160 L280 70 L475 175"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 7"
              />
            </svg>
            {stages.map((step, index) => (
              <div key={step.name} className={styles.panel} data-step={index}>
                <div className={styles.panelTop}>
                  <span className={styles.icon}>
                    <step.icon size={17} aria-hidden="true" />
                  </span>
                  <span className={styles.number}>0{index + 1}</span>
                </div>
                <p className={styles.name}>{step.name}</p>
                <p className={styles.team}>{step.team}</p>
                <div className={styles.rule} />
                <p className={styles.task}>{step.task}</p>
                <div className={styles.progress} aria-hidden="true">
                  <span style={{ width: `${step.progress}%` }} />
                </div>
                <span className={styles.status}>{step.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
