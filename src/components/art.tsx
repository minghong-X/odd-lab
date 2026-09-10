"use client";
import { useI18n } from "@/i18n/provider";
import { useId } from "react";

export function Pelican({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <svg
      className={className}
      viewBox="0 0 620 490"
      role="img"
      aria-label={t("common.pelicanArt")}
    >
      <PelicanDrawing />
    </svg>
  );
}
export function PelicanDrawing({
  part = "full",
}: {
  part?: "full" | "rider" | "vehicle";
}) {
  const id = useId().replaceAll(":", "");
  return (
    <>
      <defs>
        <linearGradient id={`${id}body`} x2=".8" y2="1">
          <stop stopColor="#fffdf4" />
          <stop offset="1" stopColor="#d6e5e9" />
        </linearGradient>
        <linearGradient id={`${id}bill`} x2=".6" y2="1">
          <stop stopColor="#f8bd61" />
          <stop offset="1" stopColor="#dd7948" />
        </linearGradient>
      </defs>
      {part !== "rider" && (
        <>
          {" "}
          <ellipse
            cx="310"
            cy="451"
            rx="226"
            ry="16"
            fill="#163b63"
            opacity=".1"
          />
          <g className="parked-vehicle">
            {[145, 467].map((cx) => (
              <g
                className="bike-wheel"
                key={cx}
                data-cx={cx}
                data-cy={359}
                transform={`rotate(0 ${cx} 359)`}
              >
                <circle
                  cx={cx}
                  cy="359"
                  r="87"
                  fill="#e8f3ef"
                  fillOpacity=".5"
                  stroke="#25475b"
                  strokeWidth="14"
                />
                <circle
                  cx={cx}
                  cy="359"
                  r="72"
                  fill="none"
                  stroke="#b2c6ce"
                  strokeWidth="3"
                />
                {[0, 30, 60, 90, 120, 150].map((r) => (
                  <path
                    key={r}
                    d={`M${cx - 73} 359h146`}
                    stroke="#7191a0"
                    strokeWidth="2"
                    transform={`rotate(${r} ${cx} 359)`}
                  />
                ))}
                <circle cx={cx} cy="359" r="9" fill="#264357" />
              </g>
            ))}
            <path
              d="M145 359l93-156 73 156H145l228-142 94 142M311 359l62-142-9-36"
              fill="none"
              stroke="#df7953"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M220 198h53m94-18 23-22h33"
              stroke="#25475b"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="311" cy="359" r="20" fill="#315064" />
            <path
              d="m311 359 31 19h22"
              stroke="#f3bb63"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        </>
      )}
      {part !== "vehicle" && (
        <>
          {" "}
          <g className="rider">
            <path
              d="M159 172c13-57 60-86 115-67 45 16 69 65 78 104 13 57-27 89-78 71-29-10-48-30-75-47l-71-5 35-26-38-11z"
              fill={`url(#${id}body)`}
              stroke="#9bb5bc"
              strokeWidth="3"
            />
            <path
              d="M178 185c24-27 75-20 118 50-56 17-93-10-118-50"
              fill="#bbcfd3"
            />
            <path
              d="m191 190 72 40m-48-39 57 28"
              stroke="#9ab7c0"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M271 133c-11-72 7-108 48-104 49 4 52 47 30 79-12 17-17 43-13 74"
              fill={`url(#${id}body)`}
              stroke="#9bb5bc"
              strokeWidth="3"
            />
            <path
              d="M340 71c48-13 105-4 163 17-52 21-105 27-159 3"
              fill={`url(#${id}bill)`}
              stroke="#c67c4f"
              strokeWidth="3"
            />
            <path
              d="M346 94c34 70 90 46 149-6"
              fill="#f4c878"
              stroke="#cc9759"
              strokeWidth="3"
            />
            <circle cx="327" cy="62" r="8" fill="#203b4f" />
            <circle cx="329" cy="59" r="2.5" fill="white" />
            <path
              d="m280 270 27 35-19 33 36 3m-1-149 54-29 12-2"
              fill="none"
              stroke="#e9a756"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="m292 132 36 6-15 15-13 30-18-10 15-26" fill="#da7255" />
          </g>
        </>
      )}
    </>
  );
}

export function Crocodile({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <svg
      className={className}
      viewBox="0 0 680 460"
      role="img"
      aria-label={t("common.crocodileArt")}
    >
      <CrocodileDrawing />
    </svg>
  );
}
export function CrocodileDrawing({
  part = "full",
}: {
  part?: "full" | "rider" | "vehicle";
}) {
  const id = useId().replaceAll(":", "");
  return (
    <>
      {part !== "rider" && (
        <>
          {" "}
          <ellipse
            cx="340"
            cy="421"
            rx="260"
            ry="17"
            fill="#163b63"
            opacity=".1"
          />
          <g className="parked-vehicle">
            {[166, 529].map((cx) => (
              <g
                key={cx}
                className="moto-wheel"
                data-cx={cx}
                data-cy={341}
                transform={`rotate(0 ${cx} 341)`}
              >
                <circle cx={cx} cy="341" r="76" fill="#294552" />
                <circle
                  cx={cx}
                  cy="341"
                  r="51"
                  fill="#c6d7d4"
                  stroke="#f8eed6"
                  strokeWidth="5"
                />
                {[0, 60, 120].map((r) => (
                  <path
                    key={r}
                    d={`M${cx - 42} 341h84`}
                    stroke="#72918d"
                    strokeWidth="7"
                    transform={`rotate(${r} ${cx} 341)`}
                  />
                ))}
                <circle cx={cx} cy="341" r="13" fill="#546e72" />
              </g>
            ))}
            <path
              d="M132 293c26-48 109-70 159-34l69 17 115-23 54 88-121-22-38 35H236l-57-58"
              fill="#c9764e"
              stroke="#844f3c"
              strokeWidth="4"
            />
            <path
              d="m351 270 56 6 32 43-126 16-54-31 12-50"
              fill="#ecd5a8"
              stroke="#8c7763"
              strokeWidth="4"
            />
            <path
              d="m528 341-57-151-33-14m35 22 40-7"
              fill="none"
              stroke="#687d7c"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <ellipse
              cx="491"
              cy="225"
              rx="26"
              ry="30"
              fill="#eebd69"
              stroke="#8c7763"
              strokeWidth="7"
            />
            <path
              d="M232 253h119"
              stroke="#334e51"
              strokeWidth="21"
              strokeLinecap="round"
            />
          </g>
        </>
      )}
      {part !== "vehicle" && (
        <>
          {" "}
          <g className="rider">
            <path
              d="M274 220C211 287 86 263 40 179c52 34 99 33 134 3 33-29 67-69 104-45"
              fill="#6c9d79"
              stroke="#426c57"
              strokeWidth="4"
            />
            <path
              d="m80 222 10-22 20 33 17-23 13 26 23-24 8 27"
              fill="#3e765b"
            />
            <path
              d="M250 234c-28-37-14-93 15-126 32-37 102-34 130 4l27 75-37 58z"
              fill="#7ca783"
              stroke="#426c57"
              strokeWidth="4"
            />
            <path d="M311 146c34-12 58 14 67 82l-48 18-45-24" fill="#c8cc97" />
            <path
              d="M293 110c-33-29-17-87 34-86 30 1 45 16 47 37l121 10c49 5 52 50 2 66l-133 12-48-20"
              fill="#7ca783"
              stroke="#426c57"
              strokeWidth="4"
            />
            <path d="M371 106h137" stroke="#426c57" strokeWidth="4" />
            <path
              d="m395 108 8 15 9-15m24 0 8 15 9-15m23 0 7 12 9-12"
              fill="#faf1ce"
            />
            <circle cx="344" cy="65" r="18" fill="#dae2b7" />
            <circle cx="350" cy="64" r="7" fill="#233c3e" />
            <circle cx="352" cy="61" r="2" fill="white" />
            <ellipse cx="489" cy="90" rx="6" ry="4" fill="#416c53" />
            <path
              d="M305 164c30 28 76 26 132 13m-126 57 39 47-20 33 39 9"
              fill="none"
              stroke="#527f62"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="m316 141 50-5-11 29-33 2z" fill="#e2a65b" />
            <path d="m327 166-30 37 22 6 24-44" fill="#e2a65b" />
          </g>
        </>
      )}
    </>
  );
}

export function Starship({
  className = "",
  cutaway = false,
}: {
  className?: string;
  cutaway?: boolean;
}) {
  const { t } = useI18n();
  return (
    <svg
      className={className}
      viewBox="0 0 460 850"
      role="img"
      aria-label={t("common.starshipArt")}
    >
      <StarshipDrawing cutaway={cutaway} />
    </svg>
  );
}
export function StarshipDrawing({ cutaway = false }: { cutaway?: boolean }) {
  const id = useId().replaceAll(":", "");
  return (
    <>
      <defs>
        <linearGradient id={`${id}metal`}>
          <stop stopColor="#768f9f" />
          <stop offset=".35" stopColor="#f0f3ec" />
          <stop offset=".65" stopColor="#c2d4d8" />
          <stop offset="1" stopColor="#577185" />
        </linearGradient>
        <linearGradient id={`${id}flame`} x2="0" y2="1">
          <stop stopColor="#fcf4b4" />
          <stop offset=".3" stopColor="#f9ac62" />
          <stop offset="1" stopColor="#e37650" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="ship-flame">
        <path
          d="M166 675c-10 50 26 116 64 171 42-62 76-127 64-171"
          fill={`url(#${id}flame)`}
        />
        <path
          d="M205 675c-11 40 13 94 25 115 20-36 39-80 26-115"
          fill="#fff8dc"
          opacity=".9"
        />
      </g>
      <path
        d="m152 478-82 163 82-21m156-142 82 163-82-21"
        fill="#7895a2"
        stroke="#39576d"
        strokeWidth="4"
      />
      <path
        d="M153 627V215C153 130 185 66 230 22c45 44 77 108 77 193v412z"
        fill={`url(#${id}metal)`}
        stroke="#56788e"
        strokeWidth="3"
      />
      <path
        d="m155 172-49 105 49-9m150-96 49 105-49-9"
        fill="#96acb5"
        stroke="#56788e"
        strokeWidth="3"
      />
      {[242, 300, 359, 418, 477, 536, 595].map((y) => (
        <path
          key={y}
          d={`M155 ${y}h150`}
          stroke="#71929f"
          strokeWidth="1.5"
          opacity=".5"
        />
      ))}
      <circle
        cx="231"
        cy="194"
        r="25"
        fill="#25495d"
        stroke="#e3eee9"
        strokeWidth="8"
      />
      <path
        d="M216 184c10-10 16-11 26-5"
        stroke="#b6d8dc"
        strokeWidth="4"
        fill="none"
      />
      <g className="ship-passengers">
        <circle cx="223" cy="197" r="9" fill="#ffeed8" />
        <path d="m226 196 12 3-12 3" fill="#ecab60" />
        <circle cx="242" cy="199" r="8" fill="#7ca783" />
        <circle cx="222" cy="194" r="1.7" fill="#233c3e" />
        <path d="M244 199h6v4h-6" fill="#7ca783" />
        <circle cx="241" cy="197" r="1.5" fill="#233c3e" />
      </g>
      <g className="ship-hatch">
        <rect
          x="172"
          y="294"
          width="104"
          height="158"
          rx="20"
          fill="#607d8a"
          stroke="#e7eee5"
          strokeWidth="5"
        />
        <rect x="179" y="301" width="90" height="145" rx="15" fill="#183746" />
        <path
          d="M190 436V322q0-10 10-10h48"
          fill="none"
          stroke="#b8c6a6"
          strokeWidth="3"
          opacity=".5"
        />
        <rect
          x="179"
          y="301"
          width="90"
          height="145"
          rx="15"
          fill={`url(#${id}metal)`}
          className="hatch-door"
        />
        <circle cx="282" cy="325" r="4" fill="#b5da98" />
      </g>
      <path d="M166 626h128v38H166z" fill="#49697a" />
      <path
        d="m179 664-10 28h31l-5-28m24 0-9 34h39l-10-34m24 0-3 28h31l-11-28"
        fill="#304b60"
      />
      <g className={`engine-cutaway ${cutaway ? "visible" : ""}`}>
        <rect x="155" y="395" width="151" height="238" rx="12" fill="#203e52" />
        <path
          d="M230 407v51m-41-35v43m85-43v43"
          stroke="#e9ba70"
          strokeWidth="11"
        />
        <ellipse cx="230" cy="486" rx="33" ry="32" fill="#afc9ca" />
        <path
          d="m209 506-28 86h99l-29-86z"
          fill="#e5b77a"
          stroke="#f3d6a5"
          strokeWidth="3"
        />
        <path
          d="M177 462h-16v86h38m78-86h17v86h-32M194 574h71m-76 12h82"
          stroke="#9ab9c4"
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M203 532h55m-60 13h65m-70 14h75"
          stroke="#705951"
          strokeWidth="3"
        />
      </g>
    </>
  );
}
