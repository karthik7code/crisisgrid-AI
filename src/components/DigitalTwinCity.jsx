import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

import AgentLabels from './AgentLabels.jsx';
import DisasterEffects from './DisasterEffects.jsx';
import PowerFlowSystem from './PowerFlowSystem.jsx';
import NegotiationAnimation from './NegotiationAnimation.jsx';
import DependencyGraph from './DependencyGraph.jsx';
import EmergencySimulation from './EmergencySimulation.jsx';
import ControlPanel from './ControlPanel.jsx';

// ============================================================================
// Helper: Status Color & Fulfillment Computation for 3D Buildings
// ============================================================================
function getBuildingEnergyVisuals(agent) {
  const demand = Math.max(1, Number(agent?.demand ?? 40));
  const allocated = Math.max(0, Number(agent?.allocated ?? agent?.allocated_power ?? demand));
  const minSafe = Math.max(0, Number(agent?.minSafe ?? agent?.minimum_safe ?? 20));
  const ratio = Math.min(1.5, allocated / demand);
  const clampedRatio = Math.max(0.05, Math.min(1, ratio));
  const minSafeRatio = Math.max(0.05, Math.min(1, minSafe / demand));
  const isUnsafe = allocated < minSafe || ratio < 0.7;
  const isReduced = !isUnsafe && ratio < 0.95;

  const statusHex = isUnsafe ? '#ef4444' : isReduced ? '#f59e0b' : '#10b981';
  const emissiveHex = isUnsafe ? '#dc2626' : isReduced ? '#d97706' : '#059669';

  return {
    demand,
    allocated,
    minSafe,
    ratio,
    clampedRatio,
    minSafeRatio,
    isUnsafe,
    isReduced,
    statusHex,
    emissiveHex,
  };
}

// ============================================================================
// 3D Building Power Gauge Pillar & Ground Status Aura Ring
// ============================================================================
function BuildingPowerColumn({
  agent,
  position = [2.4, 0, 2.0],
  maxHeight = 4.2,
  baseRadius = 3.0,
}) {
  const barMeshRef = useRef();
  const auraRingRef = useRef();
  const visuals = getBuildingEnergyVisuals(agent);

  // Scale max height slightly with demand so higher demand shows a taller capacity frame
  const dynamicHeight = useMemo(() => {
    const demandScale = Math.max(0.75, Math.min(1.6, visuals.demand / 35));
    return maxHeight * demandScale;
  }, [maxHeight, visuals.demand]);

  const minSafeY = dynamicHeight * visuals.minSafeRatio;

  useFrame((state, delta) => {
    if (barMeshRef.current) {
      const targetScaleY = Math.max(0.06, visuals.clampedRatio);
      barMeshRef.current.scale.y = THREE.MathUtils.damp(
        barMeshRef.current.scale.y,
        targetScaleY,
        6,
        delta
      );
      barMeshRef.current.position.y = (dynamicHeight * barMeshRef.current.scale.y) / 2 + 0.1;
    }
    if (auraRingRef.current) {
      const t = state.clock.getElapsedTime();
      auraRingRef.current.material.opacity = visuals.isUnsafe
        ? 0.4 + Math.sin(t * 7) * 0.35
        : visuals.isReduced
        ? 0.45
        : 0.55;
    }
  });

  return (
    <group>
      {/* Ground Status Aura Ring around building footprint */}
      <mesh
        ref={auraRingRef}
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[baseRadius, baseRadius + 0.35, 32]} />
        <meshBasicMaterial
          color={visuals.statusHex}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3D Vertical Energy Meter Column next to building */}
      <group position={position}>
        {/* Outer Glass Frame (Total Demand Capacity) */}
        <mesh position={[0, dynamicHeight / 2 + 0.1, 0]}>
          <cylinderGeometry args={[0.24, 0.24, dynamicHeight, 16]} />
          <meshStandardMaterial
            color="#0f172a"
            transparent
            opacity={0.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Inner Glowing Allocated Power Bar (scales dynamically with allocated / demand) */}
        <mesh ref={barMeshRef} position={[0, dynamicHeight / 2 + 0.1, 0]}>
          <cylinderGeometry args={[0.16, 0.16, dynamicHeight, 16]} />
          <meshStandardMaterial
            color={visuals.statusHex}
            emissive={visuals.emissiveHex}
            emissiveIntensity={visuals.isUnsafe ? 1.8 : 1.3}
            roughness={0.2}
          />
        </mesh>

        {/* Minimum Safe Threshold Ring Marker */}
        <mesh position={[0, minSafeY + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.035, 8, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Top Cap Demand Marker */}
        <mesh position={[0, dynamicHeight + 0.15, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// Low-Poly 3D Smart City Architecture Components (Driven by Live Simulation Data)
// ============================================================================

// 1. Central Power Grid Control Center (⚡ Grid Manager)
function PowerGridSubstation({
  gridSupply = 100,
  gridDemand = 120,
  totalMinSafe = 80,
  agents = [],
}) {
  const reactorRef = useRef();
  const ringRef = useRef();

  const isCriticalShortage = gridSupply < totalMinSafe;
  const isDeficit = gridSupply < gridDemand;
  const supplyRatio = Math.max(0.25, Math.min(1.5, gridSupply / Math.max(1, gridDemand)));

  const coreColor = isCriticalShortage
    ? '#ef4444'
    : isDeficit
    ? '#f59e0b'
    : '#38bdf8';
  const coreEmissive = isCriticalShortage
    ? '#dc2626'
    : isDeficit
    ? '#d97706'
    : '#0284c7';

  useFrame((state, delta) => {
    const speedFactor = Math.max(0.3, supplyRatio * 1.4);
    if (reactorRef.current) {
      reactorRef.current.rotation.y += delta * 0.9 * speedFactor;
      const targetScale = 0.75 + Math.min(0.65, (gridSupply / 120) * 0.45);
      reactorRef.current.scale.setScalar(
        THREE.MathUtils.damp(reactorRef.current.scale.x, targetScale, 5, delta)
      );
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 1.2 * speedFactor;
      ringRef.current.rotation.y += delta * 0.9 * speedFactor;
    }
  });

  const cornerPositions = [
    [-1.6, 0, -1.6],
    [-1.6, 0, 1.6],
    [1.6, 0, -1.6],
    [1.6, 0, 1.6],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* Substation Base Octagon Fortress */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.8, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Raised Containment Ring */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[2.0, 2.4, 0.4, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Central Fusion Reactor Core (scales & changes color with gridSupply) */}
      <mesh ref={reactorRef} position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.75, 24, 24]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreEmissive}
          emissiveIntensity={isCriticalShortage ? 2.0 : 1.6}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* Magnetic Containment Rings */}
      <mesh ref={ringRef} position={[0, 1.9, 0]}>
        <torusGeometry args={[1.3, 0.06, 12, 32]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.85} />
      </mesh>

      {/* 4 Transformer Bushing Towers (Each reflects one of the 4 critical service agents) */}
      {cornerPositions.map((pos, idx) => {
        const agent = agents[idx];
        const agentVisual = agent ? getBuildingEnergyVisuals(agent) : null;
        const bushingColor = agentVisual ? agentVisual.statusHex : '#38bdf8';
        return (
          <group key={idx} position={pos}>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.2, 0.3, 1.4, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshBasicMaterial color={bushingColor} />
            </mesh>
          </group>
        );
      })}

      {/* Substation Ground Glow Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.65, 32]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// 2. Hospital Complex Building (🏥 Hospital Agent)
function HospitalComplex({ agent }) {
  const towerRef = useRef();
  const crossLightRef = useRef();
  const visuals = getBuildingEnergyVisuals(agent);

  // Number of lit windows out of 12 scales directly with allocated / demand ratio
  const totalWindows = 12;
  const litWindowCount = Math.round(Math.min(1, visuals.ratio) * totalWindows);

  useFrame((state, delta) => {
    if (towerRef.current) {
      // Subtle vertical scaling of trauma wing/tower when demand surges
      const targetScaleY = Math.max(0.85, Math.min(1.35, visuals.demand / 40));
      towerRef.current.scale.y = THREE.MathUtils.damp(
        towerRef.current.scale.y,
        targetScaleY,
        4,
        delta
      );
    }
    if (crossLightRef.current) {
      const t = state.clock.getElapsedTime();
      crossLightRef.current.intensity = visuals.isUnsafe
        ? 0.5 + Math.abs(Math.sin(t * 8)) * 1.5
        : visuals.clampedRatio * 1.4;
    }
  });

  const windowCoords = [];
  const yRows = [1.2, 2.2, 3.2, 4.2];
  const xCols = [-1.0, 0, 1.0];
  yRows.forEach((y, yi) => {
    xCols.forEach((x, xi) => {
      windowCoords.push({ x, y, index: yi * 3 + xi });
    });
  });

  return (
    <group position={[-9, 0, -8]}>
      <group ref={towerRef}>
        {/* Main Medical Tower */}
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[3.4, 5.0, 3.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
        </mesh>

        {/* Emergency Trauma Wing */}
        <mesh position={[2.2, 1.2, 0.2]}>
          <boxGeometry args={[2.0, 2.4, 2.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Rooftop Helipad Pad */}
        <mesh position={[0, 5.05, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 0.1, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>

        {/* Helipad Status Ring (color reflects Hospital power safety) */}
        <mesh position={[0, 5.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 24]} />
          <meshBasicMaterial color={visuals.statusHex} side={THREE.DoubleSide} />
        </mesh>

        {/* Glowing Cross Emblem on Facade */}
        <group position={[0, 3.5, 1.55]}>
          <mesh>
            <boxGeometry args={[0.85, 0.25, 0.06]} />
            <meshBasicMaterial color={visuals.isUnsafe ? '#ef4444' : '#38bdf8'} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.25, 0.85, 0.06]} />
            <meshBasicMaterial color={visuals.isUnsafe ? '#ef4444' : '#38bdf8'} />
          </mesh>
        </group>

        {/* Medical Floor Windows (Light up or go dark based on live allocated / demand) */}
        {windowCoords.map(({ x, y, index }) => {
          const isLit = index < litWindowCount;
          const winColor = !isLit
            ? '#090d16'
            : visuals.isUnsafe
            ? '#ef4444'
            : visuals.isReduced
            ? '#fbbf24'
            : '#38bdf8';
          return (
            <mesh key={index} position={[x, y, 1.52]}>
              <planeGeometry args={[0.52, 0.42]} />
              <meshBasicMaterial color={winColor} />
            </mesh>
          );
        })}

        {/* Ambulance Bay Canopy */}
        <mesh position={[2.2, 0.4, 1.6]}>
          <boxGeometry args={[1.8, 0.12, 1.0]} />
          <meshStandardMaterial
            color={visuals.statusHex}
            emissive={visuals.emissiveHex}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>

      <pointLight
        ref={crossLightRef}
        position={[0, 4.5, 2.2]}
        color={visuals.statusHex}
        intensity={1.2}
        distance={8}
      />

      {/* Live 3D Building Power Gauge Column */}
      <BuildingPowerColumn
        agent={agent}
        position={[-2.5, 0, 2.0]}
        maxHeight={4.6}
        baseRadius={3.4}
      />
    </group>
  );
}

// 3. Water Pump Station (💧 Water Agent)
function WaterPumpStation({ agent }) {
  const rotorRef = useRef();
  const leftWaterRef = useRef();
  const rightWaterRef = useRef();
  const visuals = getBuildingEnergyVisuals(agent);

  useFrame((state, delta) => {
    // Rotor spin speed is directly proportional to allocated water pumping power
    if (rotorRef.current) {
      const spinSpeed = visuals.allocated > 0 ? Math.max(0.2, visuals.ratio * 3.2) : 0;
      rotorRef.current.rotation.y += delta * spinSpeed;
    }

    // Water levels inside twin filtration reservoirs rise/fall with allocated / demand
    const targetLevel = Math.max(0.08, visuals.clampedRatio);
    if (leftWaterRef.current) {
      leftWaterRef.current.scale.y = THREE.MathUtils.damp(
        leftWaterRef.current.scale.y,
        targetLevel,
        5,
        delta
      );
      leftWaterRef.current.position.y = (3.0 * leftWaterRef.current.scale.y) / 2 + 0.1;
    }
    if (rightWaterRef.current) {
      rightWaterRef.current.scale.y = THREE.MathUtils.damp(
        rightWaterRef.current.scale.y,
        targetLevel,
        5,
        delta
      );
      rightWaterRef.current.position.y = (3.0 * rightWaterRef.current.scale.y) / 2 + 0.1;
    }
  });

  const waterHex = visuals.isUnsafe
    ? '#ef4444'
    : visuals.isReduced
    ? '#f59e0b'
    : '#0284c7';

  return (
    <group position={[-10, 0, 9]}>
      {/* Primary Pump House */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[3.2, 2.0, 2.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Twin Water Filtration Reservoir Outer Glass Shells */}
      {[-1.8, 1.8].map((xPos, i) => (
        <mesh key={i} position={[xPos, 1.6, 0]}>
          <cylinderGeometry args={[0.92, 0.92, 3.2, 16]} />
          <meshStandardMaterial
            color="#1e293b"
            transparent
            opacity={0.35}
            roughness={0.15}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Dynamic Inner Water Level Cylinders (Scale with allocated power!) */}
      <mesh ref={leftWaterRef} position={[-1.8, 1.5, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 3.0, 16]} />
        <meshStandardMaterial
          color={waterHex}
          emissive={waterHex}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <mesh ref={rightWaterRef} position={[1.8, 1.5, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 3.0, 16]} />
        <meshStandardMaterial
          color={waterHex}
          emissive={waterHex}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* High-Pressure Intake Water Piping */}
      <mesh position={[0, 0.8, 1.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 3.6, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Roof Turbine Vent (Spins faster with higher allocated MW) */}
      <mesh ref={rotorRef} position={[0, 2.18, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.32, 6]} />
        <meshBasicMaterial color={visuals.statusHex} />
      </mesh>

      {/* Live 3D Building Power Gauge Column */}
      <BuildingPowerColumn
        agent={agent}
        position={[3.1, 0, 1.8]}
        maxHeight={3.6}
        baseRadius={3.3}
      />
    </group>
  );
}

// 4. Emergency Response Center (🚑 Emergency Agent)
function EmergencyResponseCenter({ agent }) {
  const radarDomeRef = useRef();
  const visuals = getBuildingEnergyVisuals(agent);

  // Number of active rescue dispatch bays (out of 3) scales with allocated / demand
  const activeBays = Math.round(Math.min(1, visuals.ratio) * 3);

  useFrame((state, delta) => {
    if (radarDomeRef.current) {
      radarDomeRef.current.rotation.y += delta * (0.5 + visuals.clampedRatio * 2.5);
    }
  });

  return (
    <group position={[9, 0, -8]}>
      {/* Command Bunker Main Hall */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[3.4, 2.8, 3.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Rooftop Communications Radar Dome */}
      <group ref={radarDomeRef} position={[-0.8, 3.1, -0.6]}>
        <mesh>
          <sphereGeometry args={[0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={visuals.statusHex}
            emissive={visuals.emissiveHex}
            emissiveIntensity={0.45}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Rapid Rescue Dispatch Garage Bays (3 Bay Doors light up based on allocated power) */}
      {[-1.0, 0, 1.0].map((x, idx) => {
        const isBayPowered = idx < activeBays;
        const bayColor = !isBayPowered
          ? '#0f172a'
          : visuals.isUnsafe
          ? '#ef4444'
          : visuals.isReduced
          ? '#f59e0b'
          : '#10b981';
        return (
          <mesh key={idx} position={[x, 0.7, 1.62]}>
            <planeGeometry args={[0.8, 1.2]} />
            <meshStandardMaterial
              color={bayColor}
              emissive={bayColor}
              emissiveIntensity={isBayPowered ? 0.65 : 0.05}
              metalness={0.6}
            />
          </mesh>
        );
      })}

      {/* Command Center Facade Beacon Strip */}
      <mesh position={[0, 2.5, 1.62]}>
        <planeGeometry args={[2.8, 0.22]} />
        <meshBasicMaterial color={visuals.statusHex} />
      </mesh>

      {/* Live 3D Building Power Gauge Column */}
      <BuildingPowerColumn
        agent={agent}
        position={[2.5, 0, 2.0]}
        maxHeight={3.8}
        baseRadius={3.2}
      />
    </group>
  );
}

// 5. Telecom Lattice Spire Tower (📡 Telecom Agent)
function TelecomTower({ agent }) {
  const radarRef = useRef();
  const beaconRef = useRef();
  const waveRingRef = useRef();
  const visuals = getBuildingEnergyVisuals(agent);

  useFrame((state, delta) => {
    const speedFactor = Math.max(0.15, visuals.clampedRatio * 2.2);
    if (radarRef.current) {
      radarRef.current.rotation.y += delta * speedFactor;
    }
    if (beaconRef.current) {
      const time = state.clock.getElapsedTime();
      beaconRef.current.material.opacity = 0.4 + Math.sin(time * 8) * 0.6;
    }
    if (waveRingRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = ((time * speedFactor * 0.6) % 1);
      const radiusScale = 0.6 + pulse * (1.2 + visuals.clampedRatio * 2.2);
      waveRingRef.current.scale.set(radiusScale, radiusScale, 1);
      waveRingRef.current.material.opacity = (1 - pulse) * 0.75;
    }
  });

  return (
    <group position={[10, 0, 9]}>
      {/* Tower Base Shelter Bunker */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.2, 1.6, 2.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Lattice Spire Sections */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.15, 0.8, 6.0, 4]} />
        <meshStandardMaterial color="#475569" metalness={0.9} wireframe={true} />
      </mesh>
      <mesh position={[0, 8.5, 0]}>
        <cylinderGeometry args={[0.05, 0.15, 3.5, 4]} />
        <meshStandardMaterial
          color={visuals.statusHex}
          metalness={0.9}
          wireframe={true}
        />
      </mesh>

      {/* Microwave Dish Platforms */}
      <mesh position={[0.4, 5.5, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.45, 0.45, 0.1, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </mesh>
      <mesh position={[-0.4, 6.8, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </mesh>

      {/* Rotating Parabolic Radar Dish */}
      <group ref={radarRef} position={[0, 9.8, 0]}>
        <mesh rotation={[Math.PI / 6, 0, 0]}>
          <coneGeometry args={[0.55, 0.32, 16, 1, true]} />
          <meshStandardMaterial color={visuals.statusHex} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Expanding 3D Signal Coverage Ring (scales with allocated Telecom MW) */}
      <mesh
        ref={waveRingRef}
        position={[0, 10.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.6, 0.8, 24]} />
        <meshBasicMaterial
          color={visuals.statusHex}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Spire Tip Status Beacon */}
      <mesh ref={beaconRef} position={[0, 10.5, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color={visuals.statusHex} transparent opacity={0.95} />
      </mesh>

      {/* Live 3D Building Power Gauge Column */}
      <BuildingPowerColumn
        agent={agent}
        position={[-2.2, 0, 1.8]}
        maxHeight={4.5}
        baseRadius={2.6}
      />
    </group>
  );
}

// 6. Residential & Commercial City Districts (Respond to Overall Grid Supply/Demand Ratio)
function CityDistricts({ gridSupply = 100, gridDemand = 120 }) {
  const buildings = useMemo(() => {
    return [
      // North Zone
      { pos: [-4, 0, -14], size: [2.5, 6.5, 2.5], color: '#0f172a' },
      { pos: [3, 0, -14], size: [2.8, 8.2, 2.4], color: '#1e293b' },
      { pos: [0, 0, -16], size: [3.2, 10.0, 3.0], color: '#0f172a' },
      // South Zone
      { pos: [-3, 0, 15], size: [2.4, 7.0, 2.4], color: '#1e293b' },
      { pos: [3, 0, 15], size: [2.6, 9.5, 2.6], color: '#0f172a' },
      { pos: [0, 0, 17], size: [3.0, 7.8, 2.8], color: '#1e293b' },
      // East Zone
      { pos: [15, 0, -3], size: [2.8, 9.0, 2.8], color: '#0f172a' },
      { pos: [16, 0, 3], size: [2.5, 6.8, 2.5], color: '#1e293b' },
      { pos: [14, 0, -13], size: [2.2, 5.5, 2.2], color: '#0f172a' },
      { pos: [15, 0, 13], size: [2.4, 6.0, 2.4], color: '#1e293b' },
      // West Zone
      { pos: [-15, 0, -3], size: [2.6, 8.5, 2.6], color: '#1e293b' },
      { pos: [-16, 0, 3], size: [2.8, 7.2, 2.8], color: '#0f172a' },
      { pos: [-14, 0, -13], size: [2.4, 5.8, 2.4], color: '#0f172a' },
      { pos: [-15, 0, 13], size: [2.5, 6.2, 2.5], color: '#1e293b' },
    ];
  }, []);

  const gridRatio = Math.max(0, Math.min(1, gridSupply / Math.max(1, gridDemand)));
  const litBuildingCount = Math.round(gridRatio * buildings.length);
  const isShortage = gridRatio < 0.75;

  return (
    <group name="residential-commercial-districts">
      {buildings.map((b, i) => {
        const isPowered = i < litBuildingCount;
        const winColor = !isPowered
          ? '#0f172a'
          : isShortage
          ? '#f59e0b'
          : '#38bdf8';
        const winOpacity = !isPowered ? 0.12 : isShortage ? 0.38 : 0.7;

        return (
          <group key={i} position={b.pos}>
            {/* Main Skyscraper Mesh */}
            <mesh position={[0, b.size[1] / 2, 0]}>
              <boxGeometry args={b.size} />
              <meshStandardMaterial
                color={b.color}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>

            {/* Glowing Cyber Window Stripes (Dim/Shed load when grid supply drops) */}
            <mesh position={[0, b.size[1] / 2, b.size[2] / 2 + 0.02]}>
              <planeGeometry args={[b.size[0] * 0.7, b.size[1] * 0.8]} />
              <meshBasicMaterial
                color={winColor}
                transparent
                opacity={winOpacity}
              />
            </mesh>

            {/* Rooftop HVAC unit */}
            <mesh position={[0, b.size[1] + 0.2, 0]}>
              <boxGeometry args={[1.0, 0.4, 1.0]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// 7. Ground Terrain & Cyber Road Network
function CityGroundAndRoads() {
  return (
    <group name="city-ground-and-roads">
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[65, 65, 1, 1]} />
        <meshStandardMaterial color="#050814" roughness={0.8} metalness={0.2} />
      </mesh>

      <gridHelper
        args={[60, 30, '#0284c7', '#0f172a']}
        position={[0, 0.01, 0]}
      />

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 3.4]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[60, 3.4]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[19, 21.5, 32]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[58, 0.08]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[58, 0.08]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Camera Controller for Smooth Transitions
// ============================================================================
const CAMERA_TARGETS = {
  overview: { pos: new THREE.Vector3(26, 26, 26), lookAt: new THREE.Vector3(0, 1.5, 0) },
  hospital: { pos: new THREE.Vector3(-16, 9, -15), lookAt: new THREE.Vector3(-9, 3, -8) },
  telecom: { pos: new THREE.Vector3(18, 14, 17), lookAt: new THREE.Vector3(10, 6, 9) },
  emergency: { pos: new THREE.Vector3(17, 7, -15), lookAt: new THREE.Vector3(9, 2.5, -8) },
  'auto-orbit': { pos: null, lookAt: new THREE.Vector3(0, 2, 0) },
};

function CameraController({ cameraMode = 'overview' }) {
  const controlsRef = useRef();

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (cameraMode === 'auto-orbit') {
      const time = state.clock.getElapsedTime() * 0.15;
      const radius = 34;
      state.camera.position.x = Math.sin(time) * radius;
      state.camera.position.z = Math.cos(time) * radius;
      state.camera.position.y = 22 + Math.sin(time * 0.5) * 4;
      controlsRef.current.target.set(0, 2, 0);
      controlsRef.current.update();
      return;
    }

    const currentTarget = CAMERA_TARGETS[cameraMode] || CAMERA_TARGETS.overview;
    if (currentTarget && currentTarget.pos) {
      state.camera.position.lerp(currentTarget.pos, delta * 3.0);
      controlsRef.current.target.lerp(currentTarget.lookAt, delta * 3.0);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={6}
      maxDistance={65}
    />
  );
}

// ============================================================================
// Main Digital Twin City Scene & Live Simulation Synchronizer
// ============================================================================
export default function DigitalTwinCity({
  simulation,
  initialScenario = 'Flood',
  onRunSimulation,
  onTriggerEmergency,
}) {
  const [cameraMode, setCameraMode] = useState('overview');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState(null);

  // Derive active scenario, supply, demand, and agent building states directly from live `simulation`
  const scenario = simulation?.scenario || initialScenario || 'Flood';
  const gridSupply = Number(simulation?.supply ?? 100);
  const totalMinSafe = Number(simulation?.total_minimum_safe ?? 80);
  const servicesOnline = Number(simulation?.services_online ?? 4);
  const utilizationRate = Number(simulation?.utilization_rate ?? 100);

  // Map live simulation.agents to the 4 3D city buildings
  const agents = useMemo(() => {
    const simAgents = simulation?.agents || [];
    const allocMap = simulation?.allocation || {};

    const findSimAgent = (name, defaultDemand, defaultMin, defaultPriority) => {
      const found = simAgents.find(
        (a) => String(a.name).toLowerCase() === name.toLowerCase()
      );
      if (found) {
        return {
          demand: Number(found.demand),
          allocated: Number(found.allocated_power ?? allocMap[found.name] ?? found.demand),
          minSafe: Number(found.minimum_safe ?? defaultMin),
          unmetDemand: Number(found.unmet_demand ?? Math.max(0, found.demand - found.allocated_power)),
          priority: Number(found.priority ?? defaultPriority),
          proposalEvaluation: found.proposal_evaluation || (found.allocated_power >= found.minimum_safe ? 'ACCEPT' : 'REJECT'),
          isSafe: Boolean(found.is_safe ?? found.allocated_power >= found.minimum_safe),
        };
      }
      const allocated = Number(allocMap[name] ?? defaultDemand);
      return {
        demand: defaultDemand,
        allocated,
        minSafe: defaultMin,
        unmetDemand: Math.max(0, defaultDemand - allocated),
        priority: defaultPriority,
        proposalEvaluation: allocated >= defaultMin ? 'ACCEPT' : 'REJECT',
        isSafe: allocated >= defaultMin,
      };
    };

    const h = findSimAgent('Hospital', 40, 30, 10);
    const w = findSimAgent('Water', 30, 20, 8);
    const e = findSimAgent('Emergency', 20, 15, 9);
    const t = findSimAgent('Telecom', 30, 15, 7);

    return [
      {
        id: 'hospital',
        name: 'Hospital',
        displayName: 'Hospital Agent',
        icon: '🏥',
        position: [-9, 0, -8],
        labelPosition: [-9, 7.2, -8],
        ...h,
        role: 'Trauma & ICU Operations',
      },
      {
        id: 'water',
        name: 'Water Station',
        displayName: 'Water Agent',
        icon: '💧',
        position: [-10, 0, 9],
        labelPosition: [-10, 5.2, 9],
        ...w,
        role: 'Pumping & Reservoirs',
      },
      {
        id: 'emergency',
        name: 'Emergency Center',
        displayName: 'Emergency Agent',
        icon: '🚑',
        position: [9, 0, -8],
        labelPosition: [9, 5.2, -8],
        ...e,
        role: 'Rescue Dispatch Bays',
      },
      {
        id: 'telecom',
        name: 'Telecom Spire',
        displayName: 'Telecom Agent',
        icon: '📡',
        position: [10, 0, 9],
        labelPosition: [10, 11.8, 9],
        ...t,
        role: 'Cellular & Dispatch Mesh',
      },
    ];
  }, [simulation]);

  const gridDemand = Number(
    simulation?.total_demand ?? agents.reduce((sum, a) => sum + a.demand, 0)
  );
  const hospitalAgent = agents.find((a) => a.id === 'hospital');
  const waterAgent = agents.find((a) => a.id === 'water');
  const emergencyAgent = agents.find((a) => a.id === 'emergency');
  const telecomAgent = agents.find((a) => a.id === 'telecom');

  const hospitalDemand = hospitalAgent?.demand ?? 40;
  const isEmergency =
    hospitalDemand > 45 ||
    Boolean(
      simulation?.logs?.some((l) =>
        String(l).toUpperCase().includes('EMERGENCY RENEGOTIATION')
      )
    );

  // briefly animate negotiation beams whenever `simulation` changes
  const prevSimSignature = useRef('');
  useEffect(() => {
    if (!simulation) return;
    const sig = `${simulation.scenario}-${simulation.supply}-${simulation.total_demand}-${JSON.stringify(simulation.allocation)}`;
    if (prevSimSignature.current && prevSimSignature.current !== sig) {
      setIsNegotiating(true);
      const timer = setTimeout(() => setIsNegotiating(false), 3200);
      prevSimSignature.current = sig;
      return () => clearTimeout(timer);
    }
    prevSimSignature.current = sig;
  }, [simulation]);

  // Warnings synchronized with simulation.warnings & simulation.dependency_risks
  const warnings = useMemo(() => {
    if (simulation?.warnings?.length) {
      return simulation.warnings.map((w, idx) => ({
        title: idx === 0 ? 'Grid Safety & Dependency Alert' : `Cascade Alert #${idx + 1}`,
        detail: String(w),
      }));
    }
    const list = [];
    if (telecomAgent && telecomAgent.allocated < telecomAgent.minSafe) {
      list.push({
        title: 'Emergency Communication Degraded',
        detail: `Telecom allocated ${telecomAgent.allocated} MW < ${telecomAgent.minSafe} MW safe threshold.`,
      });
    }
    if (waterAgent && waterAgent.allocated < waterAgent.minSafe) {
      list.push({
        title: 'Hospital Sanitation & Chiller Risk',
        detail: `Water station power ${waterAgent.allocated} MW < ${waterAgent.minSafe} MW.`,
      });
    }
    return list;
  }, [simulation, telecomAgent, waterAgent]);

  // Recommendations synchronized with simulation.recommendations
  const recommendations = useMemo(() => {
    if (simulation?.recommendations?.length) {
      return simulation.recommendations;
    }
    return ['All critical infrastructure nodes operating within nominal parameters.'];
  }, [simulation]);

  // Negotiation Logs synchronized with simulation.logs
  const negotiationLogs = useMemo(() => {
    if (simulation?.logs?.length) {
      return simulation.logs.map((line, i) => ({
        time: `00:${String(i + 1).padStart(2, '0')}`,
        sender: line.includes('EMERGENCY') ? 'DISPATCH ALERT' : 'Negotiation Engine',
        message: String(line),
      }));
    }
    return [
      {
        time: '00:01',
        sender: 'Grid Hub',
        message: 'System initialized. Steady-state dispatch active.',
      },
    ];
  }, [simulation]);

  // Start Negotiation Sequence
  const handleStartNegotiation = useCallback(() => {
    setIsNegotiating(true);
    setTimeout(() => {
      setIsNegotiating(false);
    }, 3500);
  }, []);

  // Select Scenario (runs real backend simulation so 3D city + app stay synced)
  const handleSelectScenario = useCallback(
    async (nextScenario) => {
      setIsNegotiating(true);
      if (onRunSimulation) {
        await onRunSimulation({ scenario: nextScenario });
      }
      setTimeout(() => setIsNegotiating(false), 3200);
    },
    [onRunSimulation]
  );

  // Update Custom Supply / Building Demand Sliders in Real Time
  const handleUpdateSimulationData = useCallback(
    async (payload) => {
      if (onRunSimulation) {
        await onRunSimulation(payload);
      }
    },
    [onRunSimulation]
  );

  // Trigger Emergency Surge (+15 MW on Hospital)
  const handleTriggerEmergencyClick = useCallback(async () => {
    setCameraMode('hospital');
    setIsNegotiating(true);
    if (onTriggerEmergency) {
      await onTriggerEmergency(15);
    }
    setTimeout(() => setIsNegotiating(false), 3500);
  }, [onTriggerEmergency]);

  // Reset Simulation back to Normal 120 MW Grid
  const handleResetSimulation = useCallback(async () => {
    setCameraMode('overview');
    setIsNegotiating(false);
    if (onRunSimulation) {
      await onRunSimulation({ scenario: 'Normal' });
    }
  }, [onRunSimulation]);

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] bg-neutral-950 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl">
      {/* 3D R3F Canvas Viewport */}
      <Canvas
        shadows
        camera={{ position: [26, 26, 26], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#040814' }}
      >
        {/* Cyber Atmosphere & Background Stars */}
        <color attach="background" args={['#040814']} />
        <fog attach="fog" args={['#040814', 20, 80]} />
        <Stars radius={80} depth={40} count={1200} factor={3} saturation={0.8} />

        {/* Ambient & Directional Lighting (reacts to grid supply vs minimum safe floor) */}
        <ambientLight
          intensity={gridSupply < totalMinSafe ? 0.28 : 0.65}
          color="#cbd5e1"
        />
        <directionalLight
          position={[20, 35, 15]}
          intensity={1.2}
          color="#38bdf8"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight
          position={[0, 8, 0]}
          intensity={1.5}
          color={gridSupply < totalMinSafe ? '#ef4444' : '#00ffcc'}
          distance={25}
        />

        {/* Camera Controller with Smooth Lerping */}
        <CameraController cameraMode={cameraMode} />

        {/* City Infrastructure Models Driven by Live Simulation Data */}
        <CityGroundAndRoads />
        <PowerGridSubstation
          gridSupply={gridSupply}
          gridDemand={gridDemand}
          totalMinSafe={totalMinSafe}
          agents={agents}
        />
        <HospitalComplex agent={hospitalAgent} />
        <WaterPumpStation agent={waterAgent} />
        <EmergencyResponseCenter agent={emergencyAgent} />
        <TelecomTower agent={telecomAgent} />
        <CityDistricts gridSupply={gridSupply} gridDemand={gridDemand} />

        {/* Dynamic Power Lines & Flow Pulses */}
        <PowerFlowSystem agents={agents} gridCenter={[0, 1.8, 0]} />

        {/* Disaster Environmental FX (Water, Cracks, Sparks) */}
        <DisasterEffects
          scenario={scenario}
          isShaking={scenario === 'Earthquake'}
        />

        {/* Multi-Agent Negotiation Data Beams & Floating Dialogues */}
        <NegotiationAnimation
          isNegotiating={isNegotiating}
          agents={agents}
          hospitalDemand={hospitalDemand}
        />

        {/* Cascading Dependency Graph & Real-time Warnings */}
        <DependencyGraph
          agents={agents}
          telecomAllocated={telecomAgent?.allocated ?? 15}
          waterAllocated={waterAgent?.allocated ?? 25}
        />

        {/* Emergency Siren Beacons & Radar Pulses */}
        <EmergencySimulation
          isEmergency={isEmergency}
          hospitalDemand={hospitalDemand}
        />

        {/* Floating 3D Holographic Building Labels */}
        <AgentLabels
          agents={agents}
          gridSupply={gridSupply}
          gridDemand={gridDemand}
          totalMinSafe={totalMinSafe}
          servicesOnline={servicesOnline}
          utilizationRate={utilizationRate}
          scenario={scenario}
          activeAgentId={activeAgentId}
          onSelectAgent={(id) => {
            setActiveAgentId(id);
            if (id === 'hospital') setCameraMode('hospital');
            else if (id === 'telecom') setCameraMode('telecom');
            else if (id === 'emergency') setCameraMode('emergency');
            else setCameraMode('overview');
          }}
        />
      </Canvas>

      {/* Cyber Command HUD Overlay */}
      <ControlPanel
        scenario={scenario}
        onSelectScenario={handleSelectScenario}
        gridSupply={gridSupply}
        gridDemand={gridDemand}
        totalMinSafe={totalMinSafe}
        agents={agents}
        warnings={warnings}
        recommendations={recommendations}
        negotiationLogs={negotiationLogs}
        cameraMode={cameraMode}
        onSelectCamera={setCameraMode}
        isNegotiating={isNegotiating}
        onStartNegotiation={handleStartNegotiation}
        isEmergency={isEmergency}
        onTriggerEmergency={handleTriggerEmergencyClick}
        onResetSimulation={handleResetSimulation}
        onUpdateSimulationData={handleUpdateSimulationData}
      />

      {/* Quick HUD Live Status Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-neutral-950/90 border border-cyan-500/30">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            gridSupply >= totalMinSafe ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
        <div className="font-mono text-xs">
          <span className="font-bold tracking-wider text-cyan-200">
            LIVE 3D TWIN · {scenario.toUpperCase()}
          </span>
          <span className="text-neutral-400 ml-2">
            Supply {gridSupply} MW / Demand {gridDemand} MW · {servicesOnline}/4 Safe
          </span>
        </div>
      </div>
    </div>
  );
}
