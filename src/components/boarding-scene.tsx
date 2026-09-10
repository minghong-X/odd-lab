"use client";
import { PelicanDrawing, CrocodileDrawing, StarshipDrawing } from "./art";
import { useI18n } from "@/i18n/provider";

/** Separate ground and cabin shots keep the complete character silhouettes visible. */
export function BoardingScene() {
  const { t } = useI18n();
  return (
    <svg
      className="boarding-scene"
      viewBox="0 0 1200 800"
      role="img"
      aria-label={t("common.boardingArt")}
    >
      <g className="launch-rig">
        <g
          className="launch-ship-drawing"
          transform="translate(750 100) scale(.85)"
        >
          <StarshipDrawing />
        </g>
      </g>
      <g className="ground-vehicles">
        <g
          className="traveler-pelican"
          transform="translate(90 370) scale(.65)"
        >
          <PelicanDrawing part="vehicle" />
        </g>
        <g
          className="traveler-crocodile"
          transform="translate(620 390) scale(.65)"
        >
          <CrocodileDrawing part="vehicle" />
        </g>
      </g>
      <g className="ground-passengers">
        <g>
          <g
            className="crocodile-seat boarding-passenger"
            transform="translate(620 390) scale(.65)"
          >
            <g>
              <CrocodileDrawing part="rider" />
            </g>
          </g>
          <g
            className="pelican-seat boarding-passenger"
            transform="translate(90 370) scale(.65)"
          >
            <g>
              <PelicanDrawing part="rider" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
