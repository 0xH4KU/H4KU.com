import React, { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'auto';
  clickable?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 0,
  position: positionProp = 'auto',
  clickable = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const timeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const showTooltip = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();

    // Determine placement based on available space
    let finalPlacement: 'top' | 'bottom' = 'top';

    if (positionProp === 'auto') {
      const spaceAbove = rect.top;
      // If less than 60px space above, show below
      finalPlacement = spaceAbove < 60 ? 'bottom' : 'top';
    } else {
      finalPlacement = positionProp;
    }

    setPlacement(finalPlacement);
    setPosition({
      x: rect.left + rect.width / 2,
      y: finalPlacement === 'bottom' ? rect.bottom + 8 : rect.top - 8,
    });
    setIsVisible(true);
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    triggerRef.current = target;

    timeoutRef.current = window.setTimeout(() => {
      showTooltip(target);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleClick = (event: React.MouseEvent) => {
    if (!clickable) return;

    const target = event.currentTarget as HTMLElement;
    triggerRef.current = target;

    if (isVisible) {
      setIsVisible(false);
    } else {
      showTooltip(target);
    }
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!clickable || !isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [clickable, isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const childProps = children.props as {
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  };

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
          childProps.onMouseEnter?.(event);
          if (!event.defaultPrevented) {
            handleMouseEnter(event);
          }
        },
        onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
          childProps.onMouseLeave?.(event);
          handleMouseLeave();
        },
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          childProps.onClick?.(event);
          handleClick(event);
        },
      } as Partial<typeof children.props>)}
      {isVisible && (
        <div
          className={`${styles.tooltip} ${placement === 'bottom' ? styles['tooltip--bottom'] : ''}`}
          style={
            {
              '--tooltip-x': `${position.x}px`,
              '--tooltip-y': `${position.y}px`,
            } as React.CSSProperties
          }
        >
          {content}
        </div>
      )}
    </>
  );
};
