import { useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { useProgress } from '@react-three/drei';
import SpaceScene, { STAGE_CENTERS } from '../components/space/SpaceScene.jsx';
import StarChart from '../components/StarChart.jsx';
import FallbackHero from '../components/FallbackHero.jsx';
import { ChevronsDown } from '../components/icons/Icons.jsx';
import AboutDestination from '../components/destinations/AboutDestination.jsx';
import TechStackDestination from '../components/destinations/TechStackDestination.jsx';
import ProjectsDestination from '../components/destinations/ProjectsDestination.jsx';
import ContactDestination from '../components/destinations/ContactDestination.jsx';

// Which planet (by key, ordered out from the sun) opens which section.
const DESTINATIONS = {
    mercury: { id: 'about', label: 'About Me' },
    venus: { id: 'tech', label: 'Tech Stack' },
    earth: { id: 'projects', label: 'Projects' },
    mars: { id: 'contact', label: 'Contact' },
};

// Caption shown while the camera dwells at a stage; fades with the dwell window.
const StageCaption = ({ progress, center, index, label }) => {
    const reduce = useReducedMotion();
    const opacity = useTransform(
        progress,
        [center - 0.08, center - 0.03, center + 0.03, center + 0.08],
        [0, 1, 1, 0]
    );
    // Drifts upward as the camera passes, like signage floating by in space.
    const drift = useTransform(progress, [center - 0.08, center, center + 0.08], [14, 0, -14]);
    return (
        <Motion.p className="stage-caption" style={{ opacity, y: reduce ? 0 : drift }}>
            <span className="stage-caption-dot" aria-hidden="true" />
            <span className="stage-caption-index">{index}</span>
            {label}
            <span className="stage-caption-hint">— click the planet</span>
        </Motion.p>
    );
};

const STAGES = [
    { center: STAGE_CENTERS.about, index: '01', label: 'About Me' },
    { center: STAGE_CENTERS.tech, index: '02', label: 'Tech Stack' },
    { center: STAGE_CENTERS.projects, index: '03', label: 'Projects' },
    { center: STAGE_CENTERS.contact, index: '04', label: 'Contact' },
];

const supportsWebGL = () => {
    try {
        const c = document.createElement('canvas');
        return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
        return false;
    }
};

/* Opaque veil while the scene's assets stream in; fades out (and hands the
   fly-in its cue) once loading completes. Never blocks past 20s. */
const LoadingVeil = ({ done, onDone }) => {
    const { progress: pct, active } = useProgress();
    const shown = Math.min(100, Math.round(pct));
    useEffect(() => {
        if (done) return undefined;
        if (!active && pct >= 100) {
            const t = setTimeout(onDone, 350);
            return () => clearTimeout(t);
        }
        const cap = setTimeout(onDone, 20000);
        return () => clearTimeout(cap);
    }, [active, pct, done, onDone]);
    return (
        <div className={`entry-veil${done ? ' is-done' : ''}`} role="status" aria-hidden={done}>
            <div className="entry-loader">
                <span className="entry-loader-label">Initializing system</span>
                <span className="entry-loader-bar" aria-hidden="true">
                    <i style={{ width: `${shown}%` }} />
                </span>
                <span className="entry-loader-pct">{shown}%</span>
            </div>
        </div>
    );
};

// Velocity model tuning.
const BASE_DRIFT = 0; // 0 lets travel settle to rest for readability
const FRICTION = 1.5; // how fast a scroll's speed bleeds off (higher = shorter coast)
const WHEEL_IMPULSE = 0.00035; // velocity added per unit of wheel delta
const TOUCH_IMPULSE = 0.004; // velocity added per pixel of touch drag
const MAX_VEL = 0.28; // capped so even hard scrolling stays a glide, not a jump

/* The journey currently ends at Contact — the outer planets are scenery until
   there are plans for them. Forward scroll stops there; backward is free. */
const MAX_POS = STAGE_CENTERS.contact;

/* Seamless docking: friction alone would end any coast at a knowable landing
   point (pos + vel / FRICTION — invariant until new input arrives). If that
   landing point falls inside a stage's capture zone, the glide is bent
   continuously so it terminates exactly on the stop. Deceleration never
   breaks, so there's no overshoot and no visible pull-back — the coast simply
   arrives parked on the viewpoint. Any new scroll moves the landing point
   instantly, which re-aims or releases the dock in the same smooth motion. */
const DOCK_TARGETS = STAGES.map((s) => s.center);
const DOCK_RADIUS = 0.035; // a coast landing inside this zone docks to the stop
const DOCK_BLEND = 6; // how firmly the glide path bends onto the stop

/* Once parked, the dock must stay rock-still. Trackpads keep emitting decaying
   momentum-tail wheel events after the fingers lift; those are absorbed rather
   than allowed to nudge the parked view. Only a deliberate input breaks the
   park: a fresh gesture after a quiet gap, or enough accumulated scroll. */
const GESTURE_GAP = 160; // ms of wheel silence that marks a new, deliberate gesture
const BREAK_DELTA = 140; // absorbed wheel px that force an undock mid-gesture
const TOUCH_BREAK = 6; // px of deliberate touch drag that breaks the park
// A forced breakout must actually clear the capture zone, or a slow sustained
// scroll would escape and get gathered straight back in, forever.
const BREAK_VEL = FRICTION * (DOCK_RADIUS + 0.015);

const Hero = () => {
    const progress = useMotionValue(0);
    const [openId, setOpenId] = useState(null);
    const [sceneReady, setSceneReady] = useState(false);
    const [webglOk] = useState(supportsWebGL);
    const openRef = useRef(false);
    const readyRef = useRef(false);
    const navRef = useRef(null); // autopilot target set by the star chart
    const warpRef = useRef(null); // straight-line flight info read by the camera

    useEffect(() => {
        openRef.current = openId != null;
    }, [openId]);

    const markReady = useCallback(() => {
        readyRef.current = true;
        setSceneReady(true);
    }, []);

    const handleNavigate = useCallback((center) => {
        setOpenId(null); // close any open panel before flying
        navRef.current = center;
    }, []);

    useEffect(() => {
        if (!webglOk) return undefined;
        const reduceMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let pos = 0;
        let vel = 0;
        let last = performance.now();
        let raf;
        let touchY = null;
        let docked = false; // parked exactly on a stage; physics fully frozen
        let absorbed = 0; // wheel px swallowed by the park since it locked
        let lastWheel = 0;

        const addImpulse = (d) => {
            if (navRef.current != null) return; // autopilot has the helm mid-warp
            vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel + d));
        };
        const onWheel = (e) => {
            // While a panel is open, don't preventDefault — the wheel needs to
            // scroll the panel's own content natively. Travel stays frozen.
            if (openRef.current) return;
            e.preventDefault();
            const now = performance.now();
            const gap = now - lastWheel;
            lastWheel = now;
            if (docked) {
                if (gap > GESTURE_GAP) {
                    // A fresh, deliberate gesture — release and respond.
                    docked = false;
                    absorbed = 0;
                } else {
                    // Momentum tail of the gesture that parked us — absorb it,
                    // unless it adds up to a real push.
                    absorbed += e.deltaY;
                    if (Math.abs(absorbed) > BREAK_DELTA) {
                        docked = false;
                        const dir = absorbed < 0 ? -1 : 1;
                        addImpulse(dir * Math.max(Math.abs(absorbed) * WHEEL_IMPULSE, BREAK_VEL));
                        absorbed = 0;
                    }
                    return;
                }
            }
            addImpulse(e.deltaY * WHEEL_IMPULSE);
        };
        const onTouchStart = (e) => {
            touchY = e.touches[0].clientY;
        };
        const onTouchMove = (e) => {
            if (touchY == null || openRef.current) return;
            const y = e.touches[0].clientY;
            const d = touchY - y;
            if (docked && Math.abs(d) > TOUCH_BREAK) docked = false; // a drag is deliberate
            if (!docked) addImpulse(d * TOUCH_IMPULSE);
            touchY = y;
        };
        const onTouchEnd = () => {
            touchY = null;
        };

        const loop = (now) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!readyRef.current || openRef.current) {
                vel = 0; // frozen while loading or reading a panel
            } else if (navRef.current != null) {
                // Autopilot from the star chart: progress eases to the target
                // while the camera cuts a straight line through space (the
                // warp info below is consumed by ScrollCamera). Manual input
                // is held until arrival.
                const target = navRef.current;
                if (!warpRef.current || warpRef.current.to !== target) {
                    warpRef.current = {
                        to: target,
                        startT: pos,
                        // Longer jumps fly gentler so mid-flight speed stays sane.
                        rate: 2.9 / (1 + Math.abs(target - pos)),
                        token: (warpRef.current?.token ?? 0) + 1,
                    };
                }
                vel = 0;
                pos = reduceMotion
                    ? target
                    : pos + (target - pos) * (1 - Math.exp(-warpRef.current.rate * dt));
                if (Math.abs(target - pos) < 0.002) {
                    pos = target;
                    navRef.current = null;
                    warpRef.current = null;
                    docked = true;
                    absorbed = 0;
                }
                progress.set(pos);
            } else if (docked) {
                vel = 0; // parked at a stage
            } else {
                vel = BASE_DRIFT + (vel - BASE_DRIFT) * Math.exp(-FRICTION * dt);
                pos += vel * dt;
                if (pos < 0) {
                    pos = 0;
                    if (vel < 0) vel = 0;
                } else if (pos > MAX_POS) {
                    pos = MAX_POS;
                    if (vel > 0) vel = 0;
                }
                const landing = pos + vel / FRICTION;
                const target = DOCK_TARGETS.find((c) => Math.abs(landing - c) < DOCK_RADIUS);
                if (target !== undefined) {
                    // Blend velocity toward the value that lands exactly on the
                    // stop. Combined with friction this is an overdamped spring
                    // (no bounce) whose settle rate matches a natural coast.
                    const steer = (target - pos) * FRICTION;
                    vel += (steer - vel) * (1 - Math.exp(-DOCK_BLEND * dt));
                    if (Math.abs(target - pos) < 0.002 && Math.abs(vel) < 0.003) {
                        pos = target;
                        vel = 0;
                        docked = true; // park: absorb momentum tails from here on
                        absorbed = 0;
                    }
                }
                progress.set(pos);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [progress, webglOk]);

    const introOpacity = useTransform(progress, [0, 0.06], [1, 0]);
    const close = () => setOpenId(null);

    if (!webglOk) return <FallbackHero />;

    return (
        <div className="journey-fixed">
            <LoadingVeil done={sceneReady} onDone={markReady} />

            <SpaceScene
                destinations={DESTINATIONS}
                onOpen={setOpenId}
                progress={progress}
                ready={sceneReady}
                warpRef={warpRef}
            />

            <Motion.div className="space-hint" style={{ opacity: introOpacity }}>
                <ChevronsDown className="space-hint-icon" />
                <span className="space-hint-text">Scroll to travel through the system</span>
            </Motion.div>

            {STAGES.map((s) => (
                <StageCaption
                    key={s.index}
                    progress={progress}
                    center={s.center}
                    index={s.index}
                    label={s.label}
                />
            ))}

            {/* CC-BY-4.0 attribution for the 3D models used in the scene */}
            <footer className="model-credits">
                <span>3D models:</span>
                <a
                    href="https://sketchfab.com/3d-models/solar-system-paint-3d-fd0cb20fd0794d3886cbbc8cc86ff6c9"
                    target="_blank"
                    rel="noreferrer"
                >
                    Solar System by Pumpkin
                </a>
                <span aria-hidden="true">·</span>
                <a
                    href="https://sketchfab.com/3d-models/need-some-space-d6521362b37b48e3a82bce4911409303"
                    target="_blank"
                    rel="noreferrer"
                >
                    Galaxy by Loïc Norgeot
                </a>
                <span>· CC-BY-4.0</span>
            </footer>

            {sceneReady && (
                <StarChart
                    progress={progress}
                    destinations={DESTINATIONS}
                    onNavigate={handleNavigate}
                    hidden={openId != null}
                />
            )}

            <AboutDestination open={openId === 'about'} onClose={close} />
            <TechStackDestination open={openId === 'tech'} onClose={close} />
            <ProjectsDestination open={openId === 'projects'} onClose={close} />
            <ContactDestination open={openId === 'contact'} onClose={close} />
        </div>
    );
};

export default Hero;
