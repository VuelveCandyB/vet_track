export default function AnimatedCapsuleDot() {
  return (
    <>
      <style>{`
        @keyframes medCapFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-10px) rotate(4deg); }
        }
        .med-capsule-dot svg {
          transform-origin: 60px 60px;
          animation: medCapFloat 3.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .med-capsule-dot svg {
            animation: none;
          }
        }
      `}</style>
      <span className="med-capsule-dot" role="img" aria-label="medicamento" style={{ display: 'inline-block', lineHeight: 0 }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 120 120"
          fill="none"
        >
          <defs>
            <clipPath id="medCapClip">
              <rect x="22" y="38" width="76" height="44" rx="22" transform="rotate(-30 60 60)" />
            </clipPath>
          </defs>
          <g clipPath="url(#medCapClip)">
            <rect x="22" y="38" width="38" height="44" transform="rotate(-30 60 60)" fill="#059669" />
          </g>
          <rect x="22" y="38" width="76" height="44" rx="22" transform="rotate(-30 60 60)" fill="none" stroke="#141414" strokeWidth="6" />
          <line x1="60" y1="38" x2="60" y2="82" transform="rotate(-30 60 60)" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </span>
    </>
  )
}
