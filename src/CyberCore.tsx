export function CyberCore() {
  return (
    <div className="cyber-core" aria-hidden="true">
      <div className="core-crosshair crosshair-tl" />
      <div className="core-crosshair crosshair-br" />
      <span className="core-coordinate coordinate-top">LK / SECURITY CORE_01</span>
      <svg viewBox="0 0 600 520" fill="none">
        <defs>
          <linearGradient
            id="core-face"
            x1="210"
            y1="160"
            x2="410"
            y2="440"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#184779" />
            <stop offset=".45" stopColor="#071c38" />
            <stop offset="1" stopColor="#020a19" />
          </linearGradient>
          <linearGradient
            id="core-metal"
            x1="230"
            y1="90"
            x2="365"
            y2="255"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#335b86" />
            <stop offset=".23" stopColor="#c6f2ff" />
            <stop offset=".45" stopColor="#1c659e" />
            <stop offset=".72" stopColor="#07162c" />
            <stop offset="1" stopColor="#48cfff" />
          </linearGradient>
          <linearGradient
            id="core-edge"
            x1="180"
            y1="170"
            x2="420"
            y2="400"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#92efff" />
            <stop offset=".5" stopColor="#146dff" />
            <stop offset="1" stopColor="#0af0ff" />
          </linearGradient>
          <radialGradient id="core-aura">
            <stop stopColor="#006eff" stopOpacity=".3" />
            <stop offset="1" stopColor="#006eff" stopOpacity="0" />
          </radialGradient>
          <filter id="core-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <ellipse cx="300" cy="280" rx="280" ry="225" fill="url(#core-aura)" />
        <g stroke="#197ddd" opacity=".18">
          <path d="M60 130h90l25 25h80M450 80v65l50 50h70M70 390h90l40 40h90M420 400l40-40h110" />
          <circle cx="60" cy="130" r="4" />
          <circle cx="450" cy="80" r="4" />
          <circle cx="70" cy="390" r="4" />
        </g>
        <g className="core-orbit">
          <ellipse
            cx="300"
            cy="280"
            rx="239"
            ry="176"
            transform="rotate(-30 300 280)"
            stroke="#227afa"
            strokeOpacity=".3"
            strokeDasharray="4 12"
          />
          <ellipse
            cx="300"
            cy="280"
            rx="249"
            ry="187"
            transform="rotate(-30 300 280)"
            stroke="#1f71da"
            strokeOpacity=".15"
          />
        </g>
        <g className="core-lock">
          <g transform="rotate(-16 300 270)">
            <path d="M236 226v-61a64 64 0 0 1 128 0v61" stroke="#03101f" strokeWidth="30" />
            <path
              d="M236 226v-61a64 64 0 0 1 128 0v61"
              stroke="url(#core-metal)"
              strokeWidth="21"
            />
            <path
              d="M241 210v-45a59 59 0 0 1 118 0"
              stroke="#7ddcff"
              strokeWidth="1.5"
              opacity=".7"
            />
            <path
              d="m204 218 25-19h174l22 25v163l-27 24H226l-22-24V218Z"
              fill="#051329"
              stroke="#164882"
            />
            <path d="m204 218 190-1 9-18H229l-25 19Z" fill="#28659b" />
            <rect
              x="193"
              y="215"
              width="207"
              height="189"
              rx="20"
              fill="url(#core-face)"
              stroke="url(#core-edge)"
              strokeWidth="2"
            />
            <rect
              x="203"
              y="225"
              width="187"
              height="169"
              rx="14"
              stroke="#2e91ef"
              strokeOpacity=".22"
            />
            <path
              d="M214 250v-14h15M365 236h14v14M214 368v14h15M365 382h14v-14"
              stroke="#46d3ff"
              strokeWidth="2"
            />
            <path
              d="M213 275h28l13 13M382 343h-28l-14-14M213 350h30M365 266h18"
              stroke="#2584f1"
              strokeOpacity=".4"
            />
            <path
              d="M301 258a24 24 0 0 0-13 44l-6 38h38l-6-38a24 24 0 0 0-13-44Z"
              fill="#15aaff"
              filter="url(#core-glow)"
            />
            <path d="M301 258a24 24 0 0 0-13 44l-6 38h38l-6-38a24 24 0 0 0-13-44Z" fill="#73ddff" />
            <path d="M270 366h56" stroke="#36bdff" strokeWidth="3" strokeLinecap="round" />
            <path d="M284 375h28" stroke="#2171d7" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
        <ellipse
          cx="300"
          cy="280"
          rx="236"
          ry="85"
          transform="rotate(-25 300 280)"
          stroke="#22b4ff"
          strokeWidth="1.2"
          strokeDasharray="420 800"
          className="core-front-orbit"
        />
        <circle cx="89" cy="336" r="5" fill="#8cecff" />
        <circle cx="484" cy="163" r="3" fill="#71dcff" />
        <path
          d="M461 348h33v33h-33z"
          fill="#071b36"
          stroke="#1775cb"
          transform="rotate(14 478 365)"
        />
        <path d="m470 365 6 5 11-13" stroke="#61d6ff" strokeWidth="2" />
        <path
          d="M112 185h30v30h-30z"
          fill="#071b36"
          stroke="#1775cb"
          transform="rotate(-14 127 200)"
        />
        <path d="M119 200h16m-8-8v16" stroke="#61d6ff" />
      </svg>
      <span className="core-coordinate coordinate-bottom">[ AUTHENTICITY: BY DESIGN ]</span>
    </div>
  );
}
