'use client';

import { useId } from 'react';

/**
 * The Digraph mark.
 *
 * Built as vector rather than shipped as an image so it stays crisp at every
 * size, follows the theme, and can animate — the graph inside the D is the whole
 * idea of the product, and letting it come alive costs nothing.
 */

interface LogoProps {
  size?: number;
  /** Plays the draw-in once on mount. */
  animate?: boolean;
  className?: string;
  title?: string;
}

export function DigraphMark({ size = 32, animate = false, className, title }: LogoProps) {
  const id = useId().replace(/:/g, '');
  const gradient = `dg-grad-${id}`;
  const glow = `dg-glow-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`digraph-mark${animate ? ' is-animated' : ''}${className ? ` ${className}` : ''}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-from)" />
          <stop offset="100%" stopColor="var(--brand-to)" />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* A solid D: it has to read as a letter at 24px, where an outline turns
          to fuzz. The graph sits on top of it in white. */}
      <path
        className="digraph-bowl"
        fill={`url(#${gradient})`}
        fillOpacity="0.85"
        d="M12 7h18a25 25 0 0 1 0 50H12l5-8V15z"
      />

      {/* The directed graph, cut into the letter. */}
      <g
        className="digraph-edges"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      >
        <path className="digraph-edge digraph-edge-1" d="M20 26h12" />
        <path className="digraph-edge digraph-edge-2" d="M21 31v6" />
        <path className="digraph-edge digraph-edge-3" d="M25 42h9" />
      </g>
      <g className="digraph-arrows" fill="#fff">
        <path d="M35 26l-4.5-3v6z" />
        <path d="M21 40l-3-4.5h6z" />
        <path d="M37 42l-4.5-3v6z" />
      </g>

      {/* The nodes are the brightest thing in the mark, so they read as the
          graph's vertices rather than as holes in the letter. */}
      <g className="digraph-nodes" filter={`url(#${glow})`}>
        <circle
          className="digraph-node digraph-node-1"
          cx="12"
          cy="30"
          r="8.5"
          fill="var(--brand-from)"
        />
        <circle
          className="digraph-node digraph-node-2"
          cx="40"
          cy="30"
          r="7"
          fill="var(--brand-to)"
        />
        <circle
          className="digraph-node digraph-node-3"
          cx="21"
          cy="43"
          r="6"
          fill="var(--brand-from)"
        />
      </g>
    </svg>
  );
}

/** Mark plus wordmark, with the dot of the "i" drawn as a node. */
export function DigraphLogo({ size = 26, animate = false, className }: LogoProps) {
  return (
    <span className={`digraph-logo${className ? ` ${className}` : ''}`}>
      <DigraphMark size={size} animate={animate} title="Digraph" />
      <span className="digraph-wordmark" aria-hidden="true">
        D<span className="digraph-i">i</span>graph
      </span>
    </span>
  );
}
