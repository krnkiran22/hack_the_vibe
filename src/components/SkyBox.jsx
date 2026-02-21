import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useState, useMemo } from "react";

export const SkyBox = () => {
    // List of available textures
    const textureFiles = useMemo(() => [
        "/textures/anime_art_style_a_water_based_pokemon_like_environ.jpg",
        "/textures/anime_art_style_cactus_forest.jpg",
        "/textures/anime_art_style_lava_world.jpg",
        "/textures/bgtext.jpg"
    ], []);

    const [texturePath, setTexturePath] = useState(textureFiles[0]);

    useEffect(() => {
        // Randomize texture on mount
        const randomIndex = Math.floor(Math.random() * textureFiles.length);
        setTexturePath(textureFiles[randomIndex]);
    }, [textureFiles]);

    const texture = useTexture(texturePath);

    // Fix texture orientation if it appears upside down
    // "im seeing only down part...but i ned up part" usually implies vertical flip is needed for inside-sphere view
    texture.flipY = true;
    // Sometimes for 360 images on spheres we need to rotate or adjust
    // If flipY=true is default and it's wrong, we might need false. 
    // But usually typically environment maps need a specific orientation.
    // Let's try rotating the sphere 180 on Z or X if flipping texture isn't enough, 
    // but usually texture.center = (0.5, 0.5); texture.rotation = Math.PI also works.
    // However, let's start with standard mapping adjustments.

    // Changing wrap/repeat to ensure it covers correctly
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // If the user says "seeing only down part", it likely means the sky (up) is missing or obscured.
    // If it's a hemisphere issue, we might need to offset the texture.
    // But assuming it's a full 360 image.

    return (
        <mesh scale={[1, -1, 1]}> {/* Invert mesh scale on Y to flip inside-out view correctly if needed, commonly used for skyboxes */}
            <sphereGeometry args={[500, 64, 64]} />
            <meshBasicMaterial
                map={texture}
                side={THREE.BackSide}
                fog={false}
            />
        </mesh>
    );
};

// Preload textures
useTexture.preload("/textures/anime_art_style_a_water_based_pokemon_like_environ.jpg");
useTexture.preload("/textures/anime_art_style_cactus_forest.jpg");
useTexture.preload("/textures/anime_art_style_lava_world.jpg");
useTexture.preload("/textures/bgtext.jpg");
