import React from 'react';
import styles from './GlitchText.module.css';

interface GlitchTextProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  as: Component = 'span',
  className = '',
}) => {
  return (
    <Component className={`${styles.glitch} ${className}`} data-text={text}>
      {text}
    </Component>
  );
};

export default GlitchText;
