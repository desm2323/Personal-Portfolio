import { useEffect, useRef, useState } from 'react';
import { motion as Motion, useTransform } from 'motion/react';
import { PLANETS } from './space/SolarSystem.jsx';
import { STAGE_CENTERS } from './space/SpaceScene.jsx';
import { X } from './icons/Icons.jsx';

/* Top-down star chart of the actual journey: world z (travel axis) maps to
   chart x, world x (the lateral zigzag) maps to chart y — so the map IS the
   real layout of the system. Collapsed it's a live mini-map; expanded it's
   the site's navigation. */

const Z_NEAR = 24; // just before the sun (z = 22), where the route begins
const Z_SPAN = 128; // through to a little past Neptune (z = -104)
// Padded to 4–96% / 18–82% so edge bodies and their glows never clip.
const toX = (z) => 4 + ((Z_NEAR - z) / Z_SPAN) * 92;
const toY = (x) => 50 + (x / 10) * 80;

const SUN = { x: toX(22), y: toY(4) };
const BODIES = PLANETS.map((p) => ({ key: p.key, x: toX(p.position[2]), y: toY(p.position[0]) }));

// Same accent triplets as the destination panels (see index.css .dest-*)
const ACCENTS = {
    mercury: '255 179 71',
    venus: '255 205 96',
    earth: '86 196 255',
    mars: '255 122 108',
};

// The route starts at the sun — Sol is stop zero of the journey.
const DEST_KEYS = ['mercury', 'venus', 'earth', 'mars'];
const ROUTE = [SUN, ...DEST_KEYS.map((k) => BODIES.find((b) => b.key === k))];
const FUTURE = [
    ROUTE[ROUTE.length - 1],
    ...['jupiter', 'saturn', 'uranus', 'neptune'].map((k) => BODIES.find((b) => b.key === k)),
];
const pts = (arr) => arr.map((p) => `${p.x},${p.y}`).join(' ');

// Anchors for the "you are here" marker — same t values the camera dwells at.
const MARKER_T = [0, STAGE_CENTERS.about, STAGE_CENTERS.tech, STAGE_CENTERS.projects, STAGE_CENTERS.contact];
const MARKER_ANCHORS = ROUTE.map((p, i) => ({ t: MARKER_T[i], x: p.x, y: p.y }));

const smoothstep = (t) => {
    const c = Math.min(1, Math.max(0, t));
    return c * c * (3 - 2 * c);
};
const sample = (p, axis) => {
    const maxT = MARKER_ANCHORS[MARKER_ANCHORS.length - 1].t;
    const t = Math.min(maxT, Math.max(0, p));
    let i = 0;
    while (i < MARKER_ANCHORS.length - 2 && t > MARKER_ANCHORS[i + 1].t) i += 1;
    const a = MARKER_ANCHORS[i];
    const b = MARKER_ANCHORS[i + 1];
    const s = smoothstep((t - a.t) / (b.t - a.t));
    return a[axis] + (b[axis] - a[axis]) * s;
};

const StarChart = ({ progress, destinations, onNavigate, hidden = false }) => {
    const [expanded, setExpanded] = useState(false);
    const rootRef = useRef(null);
    // No explicit collapse-on-hide needed: a panel only opens via a pointer
    // click outside the chart, which the outside-click listener already
    // catches and collapses on.

    const markerLeft = useTransform(progress, (p) => `${sample(p, 'x')}%`);
    const markerTop = useTransform(progress, (p) => `${sample(p, 'y')}%`);

    useEffect(() => {
        if (!expanded) return undefined;
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setExpanded(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setExpanded(false);
        };
        window.addEventListener('pointerdown', onDown);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [expanded]);

    const go = (center) => {
        onNavigate(center);
        setExpanded(false);
    };

    const stop = (key, label, center) => {
        const body = key === 'sun' ? SUN : BODIES.find((b) => b.key === key);
        const flip = body.y > 55; // bottom-half dots get their label above
        return (
            <button
                key={key}
                type="button"
                className={`chart-stop chart-stop--${key}${flip ? ' chart-stop--flip' : ''}`}
                style={{
                    left: `${body.x}%`,
                    top: `${body.y}%`,
                    '--dest-accent': ACCENTS[key] || '255 179 71',
                }}
                onClick={() => go(center)}
                tabIndex={expanded ? 0 : -1}
            >
                <span className="chart-stop-dot" aria-hidden="true" />
                <span className="chart-stop-label">{label}</span>
            </button>
        );
    };

    return (
        <div
            className={`star-chart${expanded ? ' is-expanded' : ''}${hidden ? ' is-hidden' : ''}`}
            ref={rootRef}
        >
            <div className="chart-head" aria-hidden={!expanded}>
                <span className="chart-title">Star Chart</span>
                <button
                    type="button"
                    className="chart-close"
                    onClick={() => setExpanded(false)}
                    aria-label="Close star chart"
                    tabIndex={expanded ? 0 : -1}
                >
                    <X />
                </button>
            </div>
            <div className="chart-canvas">
                <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline className="chart-route chart-route--future" points={pts(FUTURE)} />
                    <polyline className="chart-route" points={pts(ROUTE)} />
                </svg>
                {stop('sun', 'Intro', 0)}
                {BODIES.map((b) => {
                    const dest = destinations[b.key];
                    if (!dest) {
                        // No content behind this planet yet — charted, colorless.
                        return (
                            <span
                                key={b.key}
                                className={`chart-body chart-body--${b.key}`}
                                style={{ left: `${b.x}%`, top: `${b.y}%` }}
                                title={b.key}
                            />
                        );
                    }
                    return stop(b.key, dest.label, STAGE_CENTERS[dest.id]);
                })}
                <Motion.span
                    className="chart-marker"
                    style={{ left: markerLeft, top: markerTop }}
                    aria-hidden="true"
                />
            </div>
            <span className="chart-tag" aria-hidden="true">
                Star Chart
            </span>
            {!expanded && (
                <button
                    type="button"
                    className="chart-expand"
                    onClick={() => setExpanded(true)}
                    aria-label="Open star chart navigation"
                    aria-expanded="false"
                />
            )}
        </div>
    );
};

export default StarChart;
