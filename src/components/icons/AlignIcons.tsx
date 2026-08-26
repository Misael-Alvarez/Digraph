/** Alignment and distribution icons: a reference edge plus the shapes it pulls. */
function Icon({ size = 16, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const guide = { fill: 'currentColor', opacity: 0.9 };
const block = { fill: 'currentColor', opacity: 0.42 };

export const AlignLeftIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="3" width="1.6" height="18" {...guide} />
    <rect x="7" y="6" width="13" height="4" rx="1" {...block} />
    <rect x="7" y="14" width="8" height="4" rx="1" {...block} />
  </Icon>
);

export const AlignCenterXIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="11.2" y="3" width="1.6" height="18" {...guide} />
    <rect x="5" y="6" width="14" height="4" rx="1" {...block} />
    <rect x="8" y="14" width="8" height="4" rx="1" {...block} />
  </Icon>
);

export const AlignRightIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="19.4" y="3" width="1.6" height="18" {...guide} />
    <rect x="4" y="6" width="13" height="4" rx="1" {...block} />
    <rect x="9" y="14" width="8" height="4" rx="1" {...block} />
  </Icon>
);

export const AlignTopIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="1.6" {...guide} />
    <rect x="6" y="7" width="4" height="13" rx="1" {...block} />
    <rect x="14" y="7" width="4" height="8" rx="1" {...block} />
  </Icon>
);

export const AlignCenterYIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="11.2" width="18" height="1.6" {...guide} />
    <rect x="6" y="5" width="4" height="14" rx="1" {...block} />
    <rect x="14" y="8" width="4" height="8" rx="1" {...block} />
  </Icon>
);

export const AlignBottomIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="19.4" width="18" height="1.6" {...guide} />
    <rect x="6" y="4" width="4" height="13" rx="1" {...block} />
    <rect x="14" y="9" width="4" height="8" rx="1" {...block} />
  </Icon>
);

export const DistributeHorizontalIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="3" y="6" width="4" height="12" rx="1" {...block} />
    <rect x="10" y="6" width="4" height="12" rx="1" {...guide} />
    <rect x="17" y="6" width="4" height="12" rx="1" {...block} />
  </Icon>
);

export const DistributeVerticalIcon = (p: { size?: number }) => (
  <Icon {...p}>
    <rect x="6" y="3" width="12" height="4" rx="1" {...block} />
    <rect x="6" y="10" width="12" height="4" rx="1" {...guide} />
    <rect x="6" y="17" width="12" height="4" rx="1" {...block} />
  </Icon>
);
