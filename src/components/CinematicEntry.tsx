import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Center, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

interface CinematicEntryProps {
  onComplete: () => void;
}

// 3D Text Component using Text (no font file needed)
const Logo3D = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.03;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.15}
      floatIntensity={0.4}
      floatingRange={[-0.1, 0.1]}
    >
      <group ref={meshRef}>
        <Center>
          <Text
            fontSize={1.2}
            font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhiJ-Ek-_EeA.woff2"
            letterSpacing={0.1}
            textAlign="center"
          >
            REGULON
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#006688"
              emissiveIntensity={0.4}
              metalness={0.9}
              roughness={0.1}
            />
          </Text>
        </Center>
      </group>
    </Float>
  );
};

// Animated particles around the logo
const Particles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 150;
  
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00d4ff"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

// Orbital rings
const OrbitalRing = ({ radius, speed, color }: { radius: number; speed: number; color: string }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = state.clock.elapsedTime * speed;
      ringRef.current.rotation.z = state.clock.elapsedTime * speed * 0.5;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, 0.005, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
};

// Fallback for 3D loading
const Logo2DFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
      <span className="text-gradient-primary">REGULON</span>
    </h1>
  </div>
);

const CinematicEntry = ({ onComplete }: CinematicEntryProps) => {
  const [phase, setPhase] = useState<string>("logo");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("tagline"), 1200);
    const timer2 = setTimeout(() => setPhase("exit"), 3000);
    const timer3 = setTimeout(() => onComplete(), 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Background ambient layers */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary glow */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(192 85% 55% / 0.15) 0%, transparent 60%)",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Secondary glow */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(192 85% 65% / 0.2) 0%, transparent 70%)",
              }}
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
            {/* Grid lines */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(hsl(192 85% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(192 85% 55%) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* 3D Canvas */}
          <motion.div
            className="relative z-10 w-full h-[350px] md:h-[450px]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<Logo2DFallback />}>
              <Canvas
                camera={{ position: [0, 0, 6], fov: 40 }}
                dpr={[1, 2]}
              >
                <ambientLight intensity={0.4} />
                <spotLight
                  position={[10, 10, 10]}
                  angle={0.15}
                  penumbra={1}
                  intensity={1.5}
                  color="#00d4ff"
                />
                <spotLight
                  position={[-10, -5, 5]}
                  angle={0.2}
                  penumbra={1}
                  intensity={0.8}
                  color="#0088aa"
                />
                <pointLight position={[0, 0, 8]} intensity={0.5} color="#ffffff" />
                
                <Logo3D />
                <Particles />
                <OrbitalRing radius={2.5} speed={0.3} color="#00d4ff" />
                <OrbitalRing radius={3} speed={-0.2} color="#0088aa" />
                <Environment preset="night" />
              </Canvas>
            </Suspense>
          </motion.div>

          {/* Tagline */}
          <motion.div
            className="relative z-10 text-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: phase === "tagline" ? 1 : 0, 
              y: phase === "tagline" ? 0 : 30 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-lg md:text-2xl text-muted-foreground font-light tracking-wide">
              Compliance & Regulatory Command Platform
            </p>
            <div className="mt-2 flex justify-center gap-3 text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
              <span>ISO 27001</span>
              <span>•</span>
              <span>CERT-In</span>
              <span>•</span>
              <span>DPDP Act 2023</span>
            </div>
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex gap-1.5">
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
              System Initializing
            </span>
          </motion.div>

          {/* Corner accents */}
          <motion.div 
            className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-primary/40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />
          <motion.div 
            className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-primary/40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <motion.div 
            className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-primary/40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />
          <motion.div 
            className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-primary/40"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />

          {/* Scan line effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(transparent 50%, rgba(0, 212, 255, 0.02) 50%)",
              backgroundSize: "100% 4px"
            }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicEntry;
