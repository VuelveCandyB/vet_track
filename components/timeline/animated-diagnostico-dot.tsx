export default function AnimatedDiagnosticoDot() {
  return (
    <>
      <style>{`
        @keyframes medScanMove {
          0%, 100% { transform: translateX(-24px); }
          50%      { transform: translateX(24px); }
        }
        @keyframes medPulseDash {
          to { stroke-dashoffset: -240; }
        }
        .med-diag-dot .scan {
          transform-origin: 60px 60px;
          animation: medScanMove 3.4s ease-in-out infinite;
        }
        .med-diag-dot .pulse-green {
          animation: medPulseDash 2.6s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .med-diag-dot .scan,
          .med-diag-dot .pulse-green {
            animation: none;
          }
        }
      `}</style>
      <span className="med-diag-dot" role="img" aria-label="diagnóstico" style={{ display: 'inline-block', lineHeight: 0 }}>
        <svg width="32" height="32" viewBox="0 0 120 120" fill="none">
          <polyline
            points="14,62 38,62 47,62 54,40 64,82 72,62 106,62"
            fill="none"
            stroke="#141414"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            className="pulse-green"
            points="14,62 38,62 47,62 54,40 64,82 72,62 106,62"
            fill="none"
            stroke="#1f9d6b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="26 214"
          />
          <g className="scan">
            <circle cx="60" cy="58" r="22" fill="#1f9d6b" fillOpacity="0.14" />
            <circle cx="60" cy="58" r="22" fill="none" stroke="#141414" strokeWidth="3.5" />
            <line
              x1="76"
              y1="74"
              x2="92"
              y2="90"
              stroke="#141414"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </span>
    </>
  )
}
