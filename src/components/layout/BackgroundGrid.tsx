import React, { useEffect } from 'react';
import { m, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styles from './BackgroundGrid.module.css';

const BackgroundGrid: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position from -0.5 to 0.5
      const normalizedX = e.clientX / window.innerWidth - 0.5;
      const normalizedY = e.clientY / window.innerHeight - 0.5;

      mouseX.set(normalizedX);
      mouseY.set(normalizedY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax movement for different layers
  const x1 = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const y1 = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  const x2 = useTransform(smoothX, [-0.5, 0.5], [-40, 40]);
  const y2 = useTransform(smoothY, [-0.5, 0.5], [-40, 40]);

  return (
    <div className={styles.container} aria-hidden="true">
      <m.div className={styles.gridLayer} style={{ x: x1, y: y1 }} />
      <m.div className={styles.gridLayerBold} style={{ x: x2, y: y2 }} />
      <div className={styles.vignette} />
    </div>
  );
};

export default BackgroundGrid;
