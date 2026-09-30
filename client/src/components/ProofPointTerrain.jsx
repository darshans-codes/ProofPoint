import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

class TerrainErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function latLngToVector3(lat, lng, radius = 2.4) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function GlobeWireframe({ radius = 2.4, locations = [], reducedMotion = false }) {
  const meshRef = useRef();
  const { camera, pointer } = useThree();

  useFrame((_, delta) => {
    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.y += delta * 0.025;
      camera.position.x += (pointer.x * 0.16 - camera.position.x) * 0.025;
      camera.position.y += ((1.2 + pointer.y * 0.08) - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Inner dense core */}
      <mesh>
        <sphereGeometry args={[radius * 0.985, 48, 48]} />
        <meshStandardMaterial
          color="#1B221D"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle geographic reference rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.002, radius * 1.008, 64]} />
        <meshBasicMaterial color="#2F5D46" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[radius * 1.002, radius * 1.008, 64]} />
        <meshBasicMaterial color="#D8D2C4" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Interactive Project Markers */}
      {locations.map((loc) => {
        const pos = latLngToVector3(loc.lat, loc.lng, radius * 1.02);
        return <ProjectMarker key={loc.id} loc={loc} position={pos} />;
      })}
    </group>
  );
}

function ProjectMarker({ loc, position }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Pin head */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.08 : 0.05, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#E4EEE7' : '#2F5D46'}
          roughness={0.7}
          metalness={0}
        />
      </mesh>

      {/* Reference ring on hover */}
      {hovered && (
        <mesh>
          <ringGeometry args={[0.09, 0.13, 24]} />
          <meshBasicMaterial color="#2F6B4A" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Documentary Annotation Tooltip on Hover */}
      {hovered && (
        <Html distanceFactor={10} position={[0, 0.2, 0]} center>
          <div className="bg-[#1B221D] text-[#F5F2EB] p-2.5 rounded-[2px] border border-[#D8D2C4] text-left pointer-events-none select-none min-w-[170px]">
            <div className="flex items-center justify-between text-[9px] font-mono text-[#D8D2C4] border-b border-[#D8D2C4]/30 pb-1 mb-1">
              <span>{loc.region.toUpperCase()}</span>
              <span className="text-[#E4EEE7]">{loc.verifiedRate}% VERIFIED</span>
            </div>
            <div className="font-serif text-sm font-semibold leading-tight text-[#FBF9F4]">
              {loc.name}
            </div>
            <div className="mt-1 text-[10px] font-mono text-[#8E9890]">
              {loc.count} EVIDENTIARY FRAMES
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function ProofPointTerrain({ className = 'h-[500px] w-full', locations = [] }) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  React.useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <div className={`relative ${className} select-none overflow-hidden`}>
      {/* Editorial coordinate watermark in background */}
      <div className="absolute top-4 left-4 z-10 text-[10px] font-mono text-[#5F6A61] pointer-events-none space-y-0.5">
        <div>PROJECTION: GEODETIC WGS-84</div>
        <div>TOPOGRAPHIC RESOLUTION: 0.05°</div>
        <div>GPS ANCHORS: {locations.length} PROJECTS</div>
      </div>

      {hasWebGL && locations.length > 0 ? (
        <TerrainErrorBoundary onError={() => setHasWebGL(false)}>
          <Canvas
            camera={{ position: [0, 1.2, 4.6], fov: 42 }}
            dpr={reducedMotion ? 1 : [1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
              if (!gl.getContext()) {
                setHasWebGL(false);
                return;
              }
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                setHasWebGL(false);
              }, { once: true });
            }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 8, 4]} intensity={1.1} color="#FFFDF7" />
            <Suspense fallback={null}>
              <GlobeWireframe radius={2.2} locations={locations} reducedMotion={reducedMotion} />
            </Suspense>
          </Canvas>
        </TerrainErrorBoundary>
      ) : (
        <div className="h-full flex items-center justify-center px-8 text-center">
          <div>
            <p className="font-serif text-xl text-[#1B221D]">
              {locations.length === 0 ? 'No mapped projects yet.' : 'The project map is unavailable in this browser.'}
            </p>
            <p className="mt-2 text-xs font-mono text-[#5F6A61]">
              {locations.length === 0
                ? 'Add field records with GPS data to establish geographic anchors.'
                : 'Use the map view to inspect the available field records.'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom hint label */}
      <div className="absolute bottom-3 right-4 z-10 text-[10px] font-mono text-[#5F6A61] pointer-events-none">
        HOVER MARKERS TO INSPECT PROJECT EVIDENCE
      </div>
    </div>
  );
}
