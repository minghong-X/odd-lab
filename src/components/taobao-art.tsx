"use client";
import { useI18n } from "@/i18n/provider";

export function TaobaoArt() {
  const { t } = useI18n();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label={t("common.taobaoArt")}>
      <rect
        x="28"
        y="36"
        width="584"
        height="350"
        rx="22"
        fill="#fffaf5"
        stroke="#e4b89a"
        strokeWidth="3"
      />
      <path
        d="M50 36h540a22 22 0 0 1 22 22v25H28V58a22 22 0 0 1 22-22"
        fill="#f1e2d5"
      />
      {[52, 70, 88].map((x) => (
        <circle key={x} cx={x} cy="60" r="5" fill="#c6a18a" />
      ))}
      <text x="57" y="130" fontSize="34" fontWeight="800" fill="#ff5000">
        淘
      </text>
      <rect
        x="124"
        y="101"
        width="380"
        height="36"
        rx="18"
        fill="white"
        stroke="#ff5000"
        strokeWidth="3"
      />
      <rect x="443" y="104" width="58" height="30" rx="15" fill="#ff5000" />
      <circle
        cx="468"
        cy="117"
        r="6"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
      <path d="m473 122 5 5" stroke="white" strokeWidth="2" />
      <rect x="54" y="157" width="112" height="198" rx="10" fill="#f5ede6" />
      {[181, 209, 237, 265, 293, 321].map((y) => (
        <path
          key={y}
          d={`M70 ${y}h76`}
          stroke="#c7ad99"
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
      <rect x="181" y="157" width="402" height="76" rx="10" fill="#ffc28a" />
      <path
        d="M201 181h175m-175 20h120"
        stroke="#af582e"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="531" cy="196" r="24" fill="#ff8249" />
      {[181, 320, 459].map((x, i) => (
        <g key={x}>
          <rect
            x={x}
            y="247"
            width="124"
            height="108"
            rx="10"
            fill={["#dfebda", "#f5dcc9", "#dde8ec"][i]}
          />
          <rect
            x={x + 38}
            y="260"
            width="48"
            height="52"
            rx="12"
            fill={["#6c9171", "#d99061", "#7596a7"][i]}
          />
          <path
            d={`M${x + 14} 336h54`}
            stroke="#ff5000"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
  );
}
