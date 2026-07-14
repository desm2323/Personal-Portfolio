import { useMemo, useRef, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, MeshBasicMaterial } from 'three';
import { ArrowUpRight } from '../icons/Icons.jsx';
import { asset } from '../../asset.js';

const SOLAR_GLB = asset('models/solar_system.glb');

/* Planet/sun textures come from "Solar System Paint 3D" by Pumpkin
   (https://sketchfab.com/3d-models/solar-system-paint-3d-fd0cb20fd0794d3886cbbc8cc86ff6c9),
   licensed CC-BY-4.0. Each planet's texture is looked up by material name;
   position, radius and spacing are ours, so we get full control over layout. */
const SUN_MAT = 'Material_51';
export const PLANETS = [
    { key: 'mercury', mat: 'Material_58', position: [3, 0.4, 10], radius: 0.3 },
    { key: 'venus', mat: 'Material_66', position: [-3, -0.5, -5], radius: 0.55 },
    { key: 'earth', mat: 'Material_73', position: [3.2, 0.6, -20], radius: 0.6 },
    { key: 'mars', mat: 'Material_89', position: [-2.8, 0.4, -35], radius: 0.45 },
    { key: 'jupiter', mat: 'Material_96', position: [3.6, -0.9, -52], radius: 1.5 },
    { key: 'saturn', mat: 'Material_104', position: [-3.6, 0.8, -68], radius: 1.2 },
    { key: 'uranus', mat: 'Material_116', position: [3, 1, -84], radius: 0.9 },
    { key: 'neptune', mat: 'Material_126', position: [-3, -0.6, -100], radius: 0.85 },
];

let glowTex;
const getGlow = () => {
    if (glowTex) return glowTex;
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,220,150,0.55)');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    glowTex = new CanvasTexture(canvas);
    return glowTex;
};

const Planet = ({ material, position, radius, segments = 48, destination, onOpen }) => {
    const ref = useRef();
    const hoverRef = useRef(false);
    const [hovered, setHovered] = useState(false);
    const interactive = Boolean(destination);

    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.rotation.y += dt * 0.05;
        // grow a little on hover
        const target = hoverRef.current ? 1.2 : 1;
        const s = ref.current.scale.x;
        ref.current.scale.setScalar(s + (target - s) * Math.min(1, dt * 10));
    });

    const over = (e) => {
        e.stopPropagation();
        setHovered(true);
        hoverRef.current = true;
        document.body.style.cursor = 'pointer';
    };
    const out = () => {
        setHovered(false);
        hoverRef.current = false;
        document.body.style.cursor = 'auto';
    };

    return (
        <group position={position}>
            <mesh
                ref={ref}
                material={material}
                onClick={interactive ? (e) => {
                    e.stopPropagation();
                    onOpen(destination.id);
                } : undefined}
                onPointerOver={interactive ? over : undefined}
                onPointerOut={interactive ? out : undefined}
            >
                <sphereGeometry args={[radius, segments, segments]} />
            </mesh>
            {destination && (
                <Html position={[0, radius * 1.45, 0]} center distanceFactor={11} zIndexRange={[30, 0]}>
                    <div className={`planet-label${hovered ? ' is-hovered' : ''}`}>
                        <span>{destination.label}</span>
                        <ArrowUpRight className="planet-label-arrow" />
                    </div>
                </Html>
            )}
        </group>
    );
};

const SolarSystem = ({ sunPosition = [4, 0.5, 22], sunRadius = 1.9, destinations = {}, onOpen, quality = 'high' }) => {
    const { materials } = useGLTF(SOLAR_GLB);
    const sunMat = useMemo(
        () => new MeshBasicMaterial({ map: materials[SUN_MAT].map, toneMapped: false }),
        [materials]
    );
    // Low-power profile: lighter tessellation (invisible at these sizes).
    const planetSegments = quality === 'low' ? 24 : 48;
    const sunSegments = quality === 'low' ? 32 : 48;

    return (
        <group>
            <group position={sunPosition}>
                <mesh material={sunMat}>
                    <sphereGeometry args={[sunRadius, sunSegments, sunSegments]} />
                </mesh>
                <sprite scale={sunRadius * 4.5}>
                    <spriteMaterial
                        map={getGlow()}
                        color="#ffcf8a"
                        transparent
                        opacity={0.8}
                        depthWrite={false}
                        blending={AdditiveBlending}
                    />
                </sprite>
                <pointLight intensity={26} distance={140} decay={1.1} color="#ffe0b0" />
            </group>

            {PLANETS.map((p) => (
                <Planet
                    key={p.key}
                    material={materials[p.mat]}
                    position={p.position}
                    radius={p.radius}
                    segments={planetSegments}
                    destination={destinations[p.key]}
                    onOpen={onOpen}
                />
            ))}
        </group>
    );
};

useGLTF.preload(SOLAR_GLB);

export default SolarSystem;
