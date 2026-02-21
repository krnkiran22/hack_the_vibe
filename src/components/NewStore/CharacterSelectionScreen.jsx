import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CharacterSoldier } from "../CharacterSoldier";

const colors = ["black", "red", "green", "blue", "yellow", "purple", "white", "orange"];

export default function CharacterSelectionScreen() {
  const [selectedColor, setSelectedColor] = useState("black");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, padding: "20px" }}>
        <h3>Select Color</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {colors.map((color) => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                backgroundColor: color,
                width: "50px",
                height: "50px",
                cursor: "pointer",
                border: selectedColor === color ? "2px solid black" : "none",
              }}
            />
          ))}
        </div>
        <button
          style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}
          onClick={() => alert(`Color ${selectedColor} selected!`)}
        >
          Select
        </button>
      </div>
      <div style={{ flex: 3, padding: "20px" }}>
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <CharacterSoldier color={selectedColor} />
        </Canvas>
      </div>
    </div>
  );
}
