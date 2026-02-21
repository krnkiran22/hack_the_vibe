import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useState } from "react";

export const Map = () => {
  const [mapFile, setMapFile] = useState(null); // Initialize as null

  useEffect(() => {
    // Retrieve the map name from local storage
    const selectedMap = localStorage.getItem("selectedMap");
    console.log("selectedMap", selectedMap)

    // Set the map file based on the selected map
    const mapName = selectedMap ? selectedMap.toLowerCase() : "";

    if (mapName === "bermuda" || mapName === "pochinki" || mapName === "free arena") {
      setMapFile("models/map.glb");
    } else if (mapName === "knife fight map") {
      setMapFile("models/knife_fight_map.glb");
    } else if (mapName === "city side map") {
      setMapFile("models/city_side_map.glb");
    } else if (mapName === "living room") {
      setMapFile("models/living_room.glb");
    } else if (mapName === "grave house map") {
      setMapFile("models/grave_house_map.glb");
    } else if (mapName === "broken house map") {
      setMapFile("models/broken_house_map.glb");
    } else {
      setMapFile("models/map.glb"); // Default fallback
    }
  }, []); // Run only once on component mount

  // Load the map based on the file set by useEffect
  const map = useGLTF(mapFile || "models/map.glb"); // Fallback to default if mapFile is null

  useEffect(() => {
    if (map && map.scene) {
      // Traverse the map and enable shadows for meshes
      map.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [map]); // Re-run when map changes

  return mapFile ? (
    <>
      <RigidBody colliders="trimesh" type="fixed">
        <primitive object={map.scene} />
      </RigidBody>
    </>
  ) : null; // Render nothing while the mapFile is being determined
};

// Preload map files
useGLTF.preload("models/map.glb");
useGLTF.preload("models/knife_fight_map.glb");
useGLTF.preload("models/city_side_map.glb");
useGLTF.preload("models/living_room.glb");
useGLTF.preload("models/grave_house_map.glb");
useGLTF.preload("models/broken_house_map.glb");
