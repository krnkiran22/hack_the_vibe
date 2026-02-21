import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CharacterSoldier } from "../CharacterSoldier"; // Import the CharacterSoldier component

const WEAPONS = [
  "GrenadeLauncher",
  "AK",
  "Knife_1",
  "Knife_2",
  "Pistol",
  "Revolver",
  "Revolver_Small",
  "RocketLauncher",
  "ShortCannon",
  "SMG",
  "Shotgun",
  "Shovel",
  "Sniper",
  "Sniper_2",
];

const GunSelectionScreen = () => {
  const [selectedWeapon, setSelectedWeapon] = useState("");
  const orbitControlsRef = useRef();
  const characterRef = useRef();
  const initialRotation = useRef();

  useEffect(() => {
    if (characterRef.current) {
      initialRotation.current = characterRef.current.rotation.clone();
    }
  }, []);

  const handleMouseUp = () => {
    if (orbitControlsRef.current && initialRotation.current) {
      orbitControlsRef.current.reset();
      characterRef.current.rotation.copy(initialRotation.current);
    }
  };

  const handleSelect = () => {
    alert(`You have selected: ${selectedWeapon}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: "1 1 auto", display: "flex" }}>
        {/* Gun Grid */}
        <div style={{ width: "20%", padding: "10px" }}>
          <h2>Choose Your Weapon</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {WEAPONS.map((weapon) => (
              <button
                key={weapon}
                onClick={() => setSelectedWeapon(weapon)}
                style={{
                  padding: "10px",
                  backgroundColor: weapon === selectedWeapon ? "blue" : "gray",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {weapon}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Character */}
        <div style={{ width: "80%", position: "relative" }}>
          <Canvas shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2.5, 8, 5]} intensity={1.5} castShadow />
            <OrbitControls
              ref={orbitControlsRef}
              autoRotate
              autoRotateSpeed={1}
              enablePan={false}
              enableZoom={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 2}
              onEnd={handleMouseUp}
            />
            <CharacterSoldier ref={characterRef} weapon={selectedWeapon} />
          </Canvas>
        </div>
      </div>
      {/* Select Button */}
      <div style={{ padding: "10px", textAlign: "center" }}>
        <button
          onClick={handleSelect}
          style={{
            padding: "10px 20px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Select
        </button>
      </div>
    </div>
  );
};

export default GunSelectionScreen;
