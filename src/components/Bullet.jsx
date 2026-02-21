import { RigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { useEffect, useRef } from "react";
import { MeshBasicMaterial } from "three";
import { WEAPON_OFFSET } from "./CharacterController";

const bulletMaterial = new MeshBasicMaterial({
  color: "hotpink",
  toneMapped: false,
});
bulletMaterial.color.multiplyScalar(42);

export const Bullet = ({ player, angle, position, onHit, speed = 1 }) => {
  const rigidbody = useRef();
  const spawnTime = useRef(Date.now());

  useEffect(() => {
    const audio = new Audio("/audios/rifle.mp3");
    audio.play();

    // Log speed for debugging if needed
    // console.log("Bullet spawned with speed:", speed);

    const velocity = {
      x: Math.sin(angle) * speed * 20,
      y: 0,
      z: Math.cos(angle) * speed * 20,
    };

    rigidbody.current.setLinvel(velocity, true);
  }, []);

  return (
    <group position={[position.x, position.y, position.z]} rotation-y={angle}>
      <group
        position-x={WEAPON_OFFSET.x}
        position-y={WEAPON_OFFSET.y}
        position-z={WEAPON_OFFSET.z}
      >
        <RigidBody
          ref={rigidbody}
          gravityScale={0}
          onIntersectionEnter={(e) => {
            if (Date.now() - spawnTime.current < 200) return; // 200ms Immunity

            const otherUserData = e.other.rigidBody.userData;
            // Ignore self-collision and other bullets (backup check)
            if (
              otherUserData?.type === "bullet" ||
              otherUserData?.id === player ||
              otherUserData?.player === player
            ) {
              return;
            }
            rigidbody.current.setEnabled(false);
            onHit(vec3(rigidbody.current.translation()));
          }}
          sensor
          userData={{
            type: "bullet",
            player,
            damage: 10,
          }}
        >
          <mesh position-z={0.25} material={bulletMaterial} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.5]} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
};
