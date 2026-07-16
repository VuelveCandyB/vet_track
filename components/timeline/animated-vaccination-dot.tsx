export default function AnimatedVaccinationDot() {
  return (
    <>
      <style>{`
        .vac-dot .syringe { transform-origin: 60px 60px; animation: vacInject 2.8s ease-in-out infinite; }
        .vac-dot .plunger { animation: vacPlunger 2.8s ease-in-out infinite; }
        .vac-dot .drop { transform-origin: 24px 96px; animation: vacDrop 2.8s ease-in-out infinite; }
        @keyframes vacInject {
          0%, 100% { transform: translate(0,0); }
          35%      { transform: translate(-10px,10px); }
          62%      { transform: translate(-10px,10px); }
          90%      { transform: translate(0,0); }
        }
        @keyframes vacPlunger {
          0%, 34%   { transform: translateX(0); }
          60%, 100% { transform: translateX(-15px); }
        }
        @keyframes vacDrop {
          0%, 58%  { opacity: 0; transform: translate(-2px,-2px); }
          72%      { opacity: 1; transform: translate(-4px,4px); }
          100%     { opacity: 0; transform: translate(-9px,9px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vac-dot .syringe, .vac-dot .plunger, .vac-dot .drop { animation: none; }
        }
      `}</style>
      <span className="vac-dot" role="img" aria-label="vacunación" style={{ display: 'inline-block', lineHeight: 0 }}>
        <svg width="32" height="32" viewBox="0 0 120 120" fill="none">
          <circle className="drop" cx="24" cy="96" r="3.5" fill="#1f9d6b" />
          <g className="syringe">
            <g transform="rotate(-45 60 60)">
              <line x1="8" y1="60" x2="24" y2="60" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="60" x2="33" y2="60" stroke="#141414" strokeWidth="5" strokeLinecap="round" />
              <rect x="33" y="49" width="45" height="22" rx="3" fill="none" stroke="#141414" strokeWidth="3.5" />
              <rect x="36" y="52.5" width="21" height="15" rx="1.5" fill="#1f9d6b" fillOpacity="0.55" />
              <line x1="78" y1="45" x2="78" y2="75" stroke="#141414" strokeWidth="4" strokeLinecap="round" />
              <g className="plunger">
                <line x1="78" y1="60" x2="99" y2="60" stroke="#141414" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="99" y1="51" x2="99" y2="69" stroke="#141414" strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
      </span>
    </>
  )
}
