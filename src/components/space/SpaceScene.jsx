import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    Color,
    Matrix4,
    Vector3,
} from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import SolarSystem, { PLANETS } from './SolarSystem.jsx';

// Where each stage sits along the 0..1 journey. Shared with Hero's captions so
// the camera dwell and the caption fade always line up.
export const STAGE_CENTERS = { about: 0.18, tech: 0.38, projects: 0.58, contact: 0.78 };
const STAGE_CENTER_VALUES = Object.values(STAGE_CENTERS);

// Soft round sprite so each point reads as a glowing star, not a square.
let pointTexture;
const getPointTexture = () => {
    if (pointTexture) return pointTexture;
    const s = 64;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.16, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    pointTexture = new CanvasTexture(canvas);
    return pointTexture;
};

/* Recycling starfield: a tube of galaxy-like stars around the flight path.
   Stars that fall behind the camera wrap around to the front, so the field
   never runs out — you're always flying through dense stars, however far you go. */
const AmbientStars = ({ count = 13000, radius = 75, depth = 190, flatten = 0.4 }) => {
    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const c = new Color();
        for (let i = 0; i < count; i += 1) {
            const ang = Math.random() * Math.PI * 2;
            const rr = Math.sqrt(Math.random()) * radius;
            positions[i * 3] = Math.cos(ang) * rr;
            positions[i * 3 + 1] = Math.sin(ang) * rr * flatten;
            positions[i * 3 + 2] = (Math.random() - 0.5) * depth;

            const b = 0.6 + Math.random() * 0.4;
            const hue = Math.random();
            if (hue < 0.7) c.setRGB(b, b, b);
            else if (hue < 0.87) c.setRGB(b, b * 0.85, b * 0.68);
            else c.setRGB(b * 0.75, b * 0.85, b);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }
        const g = new BufferGeometry();
        g.setAttribute('position', new BufferAttribute(positions, 3));
        g.setAttribute('color', new BufferAttribute(colors, 3));
        return g;
    }, [count, radius, depth, flatten]);

    useFrame((state) => {
        const camZ = state.camera.position.z;
        const attr = geometry.attributes.position;
        const arr = attr.array;
        const back = camZ + depth * 0.15;
        const front = back - depth;
        let changed = false;
        for (let i = 2; i < arr.length; i += 3) {
            if (arr[i] > back) {
                arr[i] -= depth;
                changed = true;
            } else if (arr[i] < front) {
                arr[i] += depth;
                changed = true;
            }
        }
        if (changed) attr.needsUpdate = true;
    });

    return (
        <points geometry={geometry}>
            <pointsMaterial
                map={getPointTexture()}
                vertexColors
                size={0.16}
                sizeAttenuation
                transparent
                opacity={0.9}
                depthWrite={false}
                blending={AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

/* Colored point-cloud galaxy from a .ply file, oriented to lie flat (its plane
   in XZ, thin axis up) so the camera flies along the dense galactic plane.
   Model: "Need some space?" by Loïc Norgeot
   (https://sketchfab.com/3d-models/need-some-space-d6521362b37b48e3a82bce4911409303),
   licensed CC-BY-4.0 — see license.txt. */
const SpaceCloud = ({ targetRadius = 60, position, rotation }) => {
    const raw = useLoader(PLYLoader, '/models/model.ply');
    const geometry = useMemo(() => {
        const g = raw.clone();
        g.center();

        // Widest spread -> X, thinnest axis -> Y (up), middle -> Z (travel axis).
        g.computeBoundingBox();
        const size = new Vector3().subVectors(g.boundingBox.max, g.boundingBox.min);
        const axes = [
            { v: new Vector3(1, 0, 0), s: size.x },
            { v: new Vector3(0, 1, 0), s: size.y },
            { v: new Vector3(0, 0, 1), s: size.z },
        ].sort((a, b) => b.s - a.s);
        const xAxis = axes[0].v;
        const yAxis = axes[2].v; // smallest extent = disk normal -> up
        const zAxis = new Vector3().crossVectors(xAxis, yAxis);
        const basis = new Matrix4().makeBasis(xAxis, yAxis, zAxis).transpose();
        g.applyMatrix4(basis);

        g.computeBoundingSphere();
        const k = targetRadius / (g.boundingSphere?.radius || 1);
        g.scale(k, k, k);
        return g;
    }, [raw, targetRadius]);

    return (
        <points geometry={geometry} position={position} rotation={rotation}>
            <pointsMaterial
                map={getPointTexture()}
                vertexColors
                size={0.1}
                sizeAttenuation
                transparent
                opacity={0.45}
                depthWrite={false}
                blending={AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

// Copies of the galaxy tiled along the flight path so its stars are always
// around you — overlapping bands with varied rotation to hide the repetition.
const GALAXY_TILES = [
    { position: [0, 0, 12], rotation: [0, 0.3, 0] },
    { position: [7, -3, -28], rotation: [0, 2.1, 0] },
    { position: [-6, 3, -66], rotation: [0, 3.8, 0] },
    { position: [5, -2, -104], rotation: [0, 5.2, 0] },
];

/* Render profiles: 'high' is the full experience; 'low' keeps software
   rasterizers and weak GPUs usable — fewer points, lighter geometry, reduced
   resolution, no antialiasing. */
const PROFILES = {
    high: { dpr: 1, stars: 8000, tiles: GALAXY_TILES, antialias: true, quality: 'high' },
    low: { dpr: 0.65, stars: 2400, tiles: GALAXY_TILES.slice(0, 1), antialias: false, quality: 'low' },
};

/* Watches the real frame rate for a few seconds once the scene is live; if
   the machine can't hold a reasonable rate, asks the app to drop to the
   low-power profile. One-shot. */
const PerfGuard = ({ ready, enabled, onDegrade }) => {
    const acc = useRef({ time: 0, frames: 0, done: false });
    useFrame((_, dt) => {
        const a = acc.current;
        if (!ready || !enabled || a.done) return;
        if (dt > 0.5) return; // ignore tab-switch gaps
        a.time += dt;
        a.frames += 1;
        if (a.time >= 5) {
            a.done = true;
            if (a.frames / a.time < 26 && onDegrade) onDegrade();
        }
    });
    return null;
};

/* 3D intro text floating in space — the camera flies past it as you scroll,
   so it drifts and recedes like any other object rather than just fading. */
const IntroText = () => {
    const ref = useRef();
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (ref.current) {
            ref.current.position.y = 1 + Math.sin(t * 0.4) * 0.12;
            ref.current.rotation.z = Math.sin(t * 0.3) * 0.015;
        }
    });
    return (
        <group ref={ref} position={[-9, 1.5, 23]}>
            <Text fontSize={0.32} color="#9aa3c4" anchorX="left" anchorY="middle" letterSpacing={0.28} position={[0, 1.55, 0]}>
                PORTFOLIO · AUCKLAND NZ
            </Text>
            <Text fontSize={1.15} color="#fff7e6" anchorX="left" anchorY="middle" outlineWidth={0.008} outlineColor="#04050d" position={[0, 0.7, 0]}>
                Desmond Li
            </Text>
            <Text fontSize={0.4} color="#c6cbe0" anchorX="left" anchorY="middle" outlineWidth={0.005} outlineColor="#04050d" position={[0, -0.2, 0]}>
                Computer Science Graduate · University of Auckland
            </Text>
            <Text fontSize={0.28} color="#888fae" anchorX="left" anchorY="top" maxWidth={7} lineHeight={1.45} position={[0, -0.7, 0]}>
                Welcome to my portfolio — a journey through who I am, the tools
                I use, the projects I&apos;ve built, and how to get in touch.
            </Text>
        </group>
    );
};

const INTRO_DISTANCE = 46; // how far back the camera flies in from on load
const INTRO_DURATION = 2.3; // seconds for the entry to settle

const smoothstep = (t) => t * t * (3 - 2 * t);

/* The journey as stage waypoints, derived from the real planet layout: each
   destination planet gets a camera stop just off its shoulder, looking at it.
   Between stops the path eases with smoothstep, so the camera naturally slows
   into each stage, dwells, and glides on — the AirPods-style staged scroll. */
const buildWaypoints = () => {
    const by = Object.fromEntries(PLANETS.map((p) => [p.key, p]));
    const beside = (p) => [
        p.position[0] * 0.35,
        p.position[1] + 0.85,
        p.position[2] + 3.2 + p.radius * 3,
    ];
    const at = (p) => p.position;
    return [
        { t: 0, pos: [0, 0, 34], look: [0, 0, 12] },
        { t: STAGE_CENTERS.about, pos: beside(by.mercury), look: at(by.mercury) },
        { t: STAGE_CENTERS.tech, pos: beside(by.venus), look: at(by.venus) },
        { t: STAGE_CENTERS.projects, pos: beside(by.earth), look: at(by.earth) },
        { t: STAGE_CENTERS.contact, pos: beside(by.mars), look: at(by.mars) },
        // Outro: drift onward, gazing out at the unreachable outer planets.
        { t: 1, pos: [0.4, 0.5, -44], look: [0, -0.6, -75] },
    ];
};

/* Scroll progress (0..1) moves the camera through the stage waypoints. Layered
   on top: a one-time fly-in on load and a constant idle float, so the scene
   drifts even at rest and never snaps. */
const ScrollCamera = ({ progress, ready, warpRef }) => {
    const { camera } = useThree();
    const waypoints = useMemo(buildWaypoints, []);
    const look = useMemo(() => new Vector3(), []);
    // Scratch state for straight-line warp flights ordered by the star chart.
    const scratch = useMemo(
        () => ({
            token: 0,
            fromAmp: 1,
            pos: new Vector3(),
            fromPos: new Vector3(),
            fromLook: new Vector3(),
            toPos: new Vector3(),
            toLook: new Vector3(),
        }),
        []
    );
    // Skip the fly-in entirely for users who prefer reduced motion.
    const introRef = useRef(
        typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 1
            : 0
    );

    // The route pose (position + look target) for a given journey t.
    const poseAt = (p, outPos, outLook) => {
        let i = 0;
        while (i < waypoints.length - 2 && p > waypoints[i + 1].t) i += 1;
        const a = waypoints[i];
        const b = waypoints[i + 1];
        const s = smoothstep((p - a.t) / (b.t - a.t));
        outPos.set(
            a.pos[0] + (b.pos[0] - a.pos[0]) * s,
            a.pos[1] + (b.pos[1] - a.pos[1]) * s,
            a.pos[2] + (b.pos[2] - a.pos[2]) * s
        );
        outLook.set(
            a.look[0] + (b.look[0] - a.look[0]) * s,
            a.look[1] + (b.look[1] - a.look[1]) * s,
            a.look[2] + (b.look[2] - a.look[2]) * s
        );
    };

    useFrame((state, dt) => {
        const t = state.clock.elapsedTime;
        const p = Math.min(1, Math.max(0, progress && progress.get ? progress.get() : 0));

        // One-time entry: start further back and decelerate into place.
        // Held until assets finish loading so the fly-in isn't wasted
        // behind the loading veil.
        if (ready && introRef.current < 1) {
            introRef.current = Math.min(1, introRef.current + dt / INTRO_DURATION);
        }
        const eased = 1 - Math.pow(1 - introRef.current, 3);
        const introOffset = (1 - eased) * INTRO_DISTANCE;

        // The idle float calms almost to stillness while dwelling at a stage
        // (Hero's docking parks progress exactly on a center), so a docked
        // view reads as genuinely stopped; between stages it drifts freely.
        let nearest = Infinity;
        for (const c of STAGE_CENTER_VALUES) {
            const d = Math.abs(p - c);
            if (d < nearest) nearest = d;
        }
        const dwell = 1 - smoothstep(Math.min(1, nearest / 0.06));
        let floatAmp = 1 - dwell * 0.85;

        const warp = warpRef?.current;
        if (warp && Math.abs(warp.to - warp.startT) > 0.001) {
            /* Star-chart flight: instead of retracing the zigzag route, cut a
               straight line through space from where the camera is now to the
               target viewpoint. Progress still eases underneath (captions,
               docking and the map marker stay in sync), and at arrival the
               straight line and the route pose converge exactly. */
            if (scratch.token !== warp.token) {
                scratch.token = warp.token;
                scratch.fromAmp = floatAmp;
                // Capture the current pure pose (minus this frame's float).
                scratch.fromPos.set(
                    camera.position.x - Math.sin(t * 0.25) * 0.4 * floatAmp,
                    camera.position.y - Math.cos(t * 0.2) * 0.28 * floatAmp,
                    camera.position.z - introOffset - Math.sin(t * 0.15) * 0.3 * floatAmp
                );
                scratch.fromLook.copy(look);
            }
            poseAt(warp.to, scratch.toPos, scratch.toLook);
            const k = smoothstep(
                Math.min(1, Math.max(0, (p - warp.startT) / (warp.to - warp.startT)))
            );
            /* The dwell logic above would flick the float's amplitude every
               time p sweeps past an intermediate stage mid-flight — sudden
               jolts. During a warp, ease once from the departure amplitude
               to the docked amplitude and hold it there instead. */
            floatAmp = scratch.fromAmp + (0.15 - scratch.fromAmp) * Math.min(1, k * 2.5);
            scratch.pos.lerpVectors(scratch.fromPos, scratch.toPos, k);
            look.lerpVectors(scratch.fromLook, scratch.toLook, k);
        } else {
            poseAt(p, scratch.pos, look);
        }

        const floatX = Math.sin(t * 0.25) * 0.4 * floatAmp;
        const floatY = Math.cos(t * 0.2) * 0.28 * floatAmp;
        const floatZ = Math.sin(t * 0.15) * 0.3 * floatAmp;

        camera.position.set(
            scratch.pos.x + floatX,
            scratch.pos.y + floatY,
            scratch.pos.z + introOffset + floatZ
        );
        camera.lookAt(look);
    });
    return null;
};

const SpaceScene = ({ destinations, onOpen, progress, ready, warpRef, perfMode = 'high', onDegrade }) => {
    const profile = PROFILES[perfMode] ?? PROFILES.high;
    return (
        <Canvas
            className="space-canvas"
            dpr={profile.dpr}
            gl={{ antialias: profile.antialias, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, 34], fov: 55 }}
        >
            <color attach="background" args={['#04050d']} />
            <ambientLight intensity={0.6} />
            {/* Sunlight from the +Z (sun) end of the row toward the planets. */}
            <directionalLight position={[0, 4, 26]} intensity={1.4} color="#ffe6c0" />

            {/* Base layer: recycling field that always surrounds the camera, so star
                density is consistent from the first frame to the last. */}
            <AmbientStars count={profile.stars} radius={70} depth={170} />

            {/* Rich layer: the galaxy model tiled along the route. */}
            <Suspense fallback={null}>
                {profile.tiles.map((t, i) => (
                    <SpaceCloud key={i} position={t.position} rotation={t.rotation} />
                ))}
            </Suspense>

            <IntroText />

            <Suspense fallback={null}>
                <SolarSystem destinations={destinations} onOpen={onOpen} quality={profile.quality} />
            </Suspense>

            <ScrollCamera progress={progress} ready={ready} warpRef={warpRef} />
            <PerfGuard ready={ready} enabled={perfMode === 'high'} onDegrade={onDegrade} />
        </Canvas>
    );
};

export default SpaceScene;
