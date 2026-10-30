"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, type MutableRefObject } from "react";
import {
  WORLD_HOME,
  WORLD_LOCATIONS,
  WORLD_PINS,
  locationBySlug,
  type WorldLocation,
} from "@/lib/world";

// Pins (places I'm headed) are the one splash of color on a monochrome globe.
const PIN_RGB = "239,68,68";
// The home star is the other: gold, so it never reads as a pin.
const HOME_RGB = "251,191,36";

// The trips drawn on the globe: one arc per pin that has a journey, from the
// visited place it starts at to the pin itself.
type Journey = {
  slug: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};
const JOURNEYS: Journey[] = WORLD_PINS.flatMap((pin) => {
  const from = pin.journey ? locationBySlug(pin.journey.from) : undefined;
  return from
    ? [
        {
          slug: pin.slug,
          startLat: from.lat,
          startLng: from.lng,
          endLat: pin.lat,
          endLng: pin.lng,
        },
      ]
    : [];
});

export type GlobeApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  // Freeze the globe entirely while the dio sequence plays: stop the idle
  // auto-spin AND block drag-rotate. Unfreeze when it ends.
  setFrozen: (frozen: boolean) => void;
  // Move the camera over a place. The page sequences these for a journey.
  flyTo: (lat: number, lng: number, altitude: number, ms: number) => void;
};

type Props = {
  activeSlug: string | null;
  onSelectLocation: (slug: string) => void;
  // Clicking the globe somewhere other than a visited shape closes the panel.
  onDeselect: () => void;
  // The parent uses this to drive the on-screen zoom buttons.
  apiRef: MutableRefObject<GlobeApi | null>;
};

export default function MyWorldGlobe({
  activeSlug,
  onSelectLocation,
  onDeselect,
  apiRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<any>(null);
  const countriesRef = useRef<any[]>([]);
  const statesRef = useRef<any[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const hoveredPinRef = useRef<string | null>(null);

  // Latest props in a ref so click closures never go stale.
  const stateRef = useRef<Props>({
    activeSlug,
    onSelectLocation,
    onDeselect,
    apiRef,
  });
  stateRef.current = { activeSlug, onSelectLocation, onDeselect, apiRef };

  // ----- shape lookups -------------------------------------------------
  const countryFeature = (admin: string) =>
    countriesRef.current.find((f) => f?.properties?.ADMIN === admin);
  const stateFeature = (name: string) =>
    statesRef.current.find((f) => f?.properties?.name === name);
  const locationShape = (loc: WorldLocation) =>
    loc.highlight.source === "states"
      ? stateFeature(loc.highlight.name)
      : countryFeature(loc.highlight.name);

  // Every visited place is a bright, clickable overlay shape (tagged __mw with
  // its slug). No region step: all of them glow and are clickable at once.
  const overlayShapes = (): any[] => {
    const out: any[] = [];
    for (const loc of WORLD_LOCATIONS) {
      const f = locationShape(loc);
      if (f) {
        f.__mw = loc.slug;
        out.push(f);
      }
    }
    return out;
  };

  // ----- polygon styling (monochrome) ----------------------------------
  // Base = every country, faint solid fill. Visited shapes carry __mw and glow
  // brighter; the selected / hovered one is brightest and lifted.
  const isOverlay = (f: any) => typeof f?.__mw === "string";
  const overlayState = (f: any): "selected" | "hovered" | "idle" => {
    const slug: string | undefined = f?.__mw;
    if (!slug) return "idle";
    if (slug === stateRef.current.activeSlug) return "selected";
    if (hoveredRef.current === slug) return "hovered";
    return "idle";
  };

  const capColor = (f: any) => {
    if (!isOverlay(f)) return "rgba(255, 255, 255, 0.16)";
    switch (overlayState(f)) {
      case "selected":
        return "rgba(255, 255, 255, 1)";
      case "hovered":
        return "rgba(255, 255, 255, 0.8)";
      default:
        return "rgba(255, 255, 255, 0.55)";
    }
  };
  const strokeColor = (f: any) => {
    if (!isOverlay(f)) return "rgba(255, 255, 255, 0.28)";
    return overlayState(f) === "idle"
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(255, 255, 255, 1)";
  };
  const sideColor = () => "rgba(255, 255, 255, 0.12)";
  const altitude = (f: any) => {
    if (!isOverlay(f)) return 0.006;
    return overlayState(f) === "idle" ? 0.022 : 0.038;
  };

  // Either kind of hover (shape or pin) means "clickable".
  const updateCursor = (container: HTMLElement) => {
    container.style.cursor =
      hoveredRef.current || hoveredPinRef.current ? "pointer" : "grab";
  };

  // ----- pin styling -----------------------------------------------------
  // Red; the selected pin lifts to a paler red so it reads as lit.
  const pinColor = (p: any) =>
    p?.slug === stateRef.current.activeSlug
      ? "rgb(254,202,202)"
      : `rgb(${PIN_RGB})`;

  const applyPolyStyles = () => {
    const world = worldRef.current;
    if (!world) return;
    world
      .polygonCapColor(capColor)
      .polygonSideColor(sideColor)
      .polygonStrokeColor(strokeColor)
      .polygonAltitude(altitude);
  };

  const refresh = () => {
    const world = worldRef.current;
    if (!world) return;
    countriesRef.current.forEach((f) => {
      if (f) delete f.__mw;
    });
    statesRef.current.forEach((f) => {
      if (f) delete f.__mw;
    });
    const overlay = overlayShapes();
    // Base = every country except the ones promoted into the overlay, so each
    // shape is drawn exactly once (no duplicate / z-fighting for country shapes
    // whose overlay entries are the same objects as the base countries).
    const base = countriesRef.current.filter((f) => !overlay.includes(f));
    world.polygonsData(base.concat(overlay));
    applyPolyStyles();
    world.pointColor(pinColor);
  };

  // ----- init once -----------------------------------------------------
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;

    (async () => {
      const container = containerRef.current;
      if (!container) return;

      const GlobeModule = await import("globe.gl");
      const Globe = (GlobeModule as any).default;
      if (disposed) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const rect = container.getBoundingClientRect();
      const world = Globe()(container)
        .width(Math.max(1, rect.width))
        .height(Math.max(1, rect.height))
        .backgroundColor("rgba(0,0,0,0)")
        .showGlobe(true)
        .showAtmosphere(true)
        .atmosphereColor("#9aa3b2")
        .atmosphereAltitude(0.16)
        .polygonsTransitionDuration(300)
        .polygonCapColor(capColor)
        .polygonSideColor(sideColor)
        .polygonStrokeColor(strokeColor)
        .polygonAltitude(altitude)
        .polygonLabel((f: any) => {
          // Hover tooltip: show the place name on visited shapes only, so you
          // can hover around (e.g. find Tennessee) and pick another one.
          if (!isOverlay(f)) return "";
          const loc = WORLD_LOCATIONS.find((l) => l.slug === f.__mw);
          return loc ? `<div class="mw-tooltip">${loc.label}</div>` : "";
        })
        .onPolygonHover((f: any) => {
          hoveredRef.current = isOverlay(f) ? f.__mw : null;
          updateCursor(container);
          applyPolyStyles();
        })
        .onPolygonClick((f: any) => {
          // A visited shape selects; any other polygon closes the panel.
          if (isOverlay(f)) stateRef.current.onSelectLocation(f.__mw);
          else stateRef.current.onDeselect();
        })
        .onGlobeClick(() => {
          // Clicking the ocean / empty globe closes the panel.
          stateRef.current.onDeselect();
        })
        // Pins: places I'm headed. A red stud on the surface plus a pulse
        // ring so it catches the eye from across the globe. The ring is
        // decoration only, so it sits out under reduced motion.
        .pointsData(WORLD_PINS)
        .pointColor(pinColor)
        // Low and wide: a disc about a third of Washington across, so it
        // reads as a dot from the default zoom and is big enough to click.
        .pointAltitude(0.012)
        .pointRadius(1.0)
        .pointResolution(24)
        .pointLabel(
          (p: any) => `<div class="mw-tooltip mw-tooltip-pin">${p.label}</div>`,
        )
        .onPointHover((p: any) => {
          hoveredPinRef.current = p ? p.slug : null;
          updateCursor(container);
        })
        .onPointClick((p: any) => stateRef.current.onSelectLocation(p.slug))
        .ringsData(reduceMotion ? [] : WORLD_PINS)
        .ringColor(() => (t: number) => `rgba(${PIN_RGB},${1 - t})`)
        .ringMaxRadius(4)
        .ringPropagationSpeed(1.8)
        .ringRepeatPeriod(1300)
        .ringAltitude(0.013)
        // The trip: a dashed arc from home to each pin, running towards the
        // pin so it reads as "on the way". Static under reduced motion.
        .arcsData(JOURNEYS)
        .arcStartLat("startLat")
        .arcStartLng("startLng")
        .arcEndLat("endLat")
        .arcEndLng("endLng")
        .arcColor(() => [`rgba(${HOME_RGB},0.9)`, `rgba(${PIN_RGB},0.95)`])
        .arcAltitudeAutoScale(0.32)
        .arcStroke(0.42)
        .arcDashLength(0.3)
        .arcDashGap(0.12)
        .arcDashAnimateTime(reduceMotion ? 0 : 2200)
        .arcsTransitionDuration(0)
        .onArcHover((a: any) => {
          hoveredPinRef.current = a ? a.slug : null;
          updateCursor(container);
        })
        .onArcClick((a: any) => stateRef.current.onSelectLocation(a.slug))
        // Home: a gold star on where I am right now. A DOM element, so it is
        // crisp at any zoom; globe.gl keeps it centered on the point and hides
        // it round the back of the globe.
        .htmlElementsData([WORLD_HOME])
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.02)
        .htmlTransitionDuration(0)
        .htmlElement((d: any) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "mw-home";
          const place = locationBySlug(d.slug);
          el.setAttribute(
            "aria-label",
            `${d.label}: ${place?.label ?? d.slug}`,
          );
          el.innerHTML =
            `<svg class="mw-home-star" viewBox="0 0 24 24" aria-hidden="true">` +
            `<path d="M12 1.8l3 6.4 7 .9-5.1 4.8 1.3 6.9L12 17.4l-6.2 3.4 1.3-6.9L2 9.1l7-.9z"/>` +
            `</svg>` +
            `<span class="mw-home-label">${d.label}</span>`;
          // The globe listens for clicks on the whole container, so a click
          // here would also raycast into the sphere underneath. Swallow it.
          const swallow = (e: Event) => e.stopPropagation();
          el.addEventListener("pointerdown", swallow);
          el.addEventListener("pointerup", swallow);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            stateRef.current.onSelectLocation(d.slug);
          });
          return el;
        })
        .htmlElementVisibilityModifier((el: HTMLElement, visible: boolean) => {
          el.style.opacity = visible ? "1" : "0";
          el.style.pointerEvents = visible ? "auto" : "none";
        });

      // Monochrome dark ocean.
      const mat = world.globeMaterial();
      if (mat?.color) {
        mat.color.set("#05060b");
        if (mat.emissive) mat.emissive.set("#0b0d16");
        mat.emissiveIntensity = 0.35;
        mat.shininess = 0.6;
      }

      // Controls: idle auto-spin + free drag. Wheel/pinch zoom is OFF so the
      // page can scroll past this section; zoom is handled by the +/- buttons.
      const controls = world.controls();
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 0.32;
      controls.rotateSpeed = 0.85;
      controls.dampingFactor = 0.12;
      controls.enableDamping = true;
      container.style.cursor = "grab";

      world.pointOfView({ lat: 18, lng: -40, altitude: 2.6 }, 0);
      worldRef.current = world;

      // Expose zoom controls to the parent.
      const zoomBy = (factor: number) => {
        const pov = world.pointOfView();
        const next = Math.max(0.6, Math.min(3.5, pov.altitude * factor));
        world.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: next }, 350);
      };
      stateRef.current.apiRef.current = {
        zoomIn: () => zoomBy(0.72),
        zoomOut: () => zoomBy(1 / 0.72),
        flyTo: (lat, lng, altitude, ms) =>
          world.pointOfView({ lat, lng, altitude }, ms),
        // Never force rotation back on when the user prefers reduced motion.
        setFrozen: (frozen: boolean) => {
          controls.autoRotate = !frozen && !reduceMotion;
          controls.enableRotate = !frozen;
        },
      };

      // Load datasets, then draw.
      try {
        const [countriesRes, statesRes] = await Promise.all([
          fetch("/data/countries-110m.geojson"),
          fetch("/data/us-states-subset.geojson"),
        ]);
        const countries = await countriesRes.json();
        const states = await statesRes.json();
        if (disposed) return;
        countriesRef.current = countries.features || [];
        statesRef.current = states.features || [];
      } catch {
        // If a dataset fails the globe still spins; we just have no shapes.
      }
      refresh();

      ro = new ResizeObserver(() => {
        const r = container.getBoundingClientRect();
        world.width(Math.max(1, r.width));
        world.height(Math.max(1, r.height));
      });
      ro.observe(container);
    })();

    return () => {
      disposed = true;
      if (ro) ro.disconnect();
      const world = worldRef.current;
      if (world && typeof world._destructor === "function") world._destructor();
      if (containerRef.current) containerRef.current.innerHTML = "";
      worldRef.current = null;
      apiRef.current = null;
    };
    // Init runs once; updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- react to selection changes ------------------------------------
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    refresh();

    if (activeSlug) {
      const loc =
        WORLD_LOCATIONS.find((l) => l.slug === activeSlug) ??
        WORLD_PINS.find((p) => p.slug === activeSlug);
      if (loc) {
        // Keep some altitude so neighboring places stay in view and clickable.
        world.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.7 }, 900);
      }
    } else {
      world.pointOfView({ lat: 18, lng: -40, altitude: 2.6 }, 900);
    }
    // refresh()/POV read fresh values via stateRef each call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  return <div ref={containerRef} className="h-full w-full" />;
}
