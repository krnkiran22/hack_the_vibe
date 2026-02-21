import React, { useState, useEffect, useRef } from "react";
import { Billboard, CameraControls, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { myPlayer } from "playroomkit";
import { useSelector } from "react-redux";
import { CharacterSoldier } from "./CharacterSoldier";

const itemsData = {
  CHARACTERS: [
    { name: "SHADOW ELITE", color: "#000000" },
    { name: "URBAN STRIKER", color: "#3b82f6" },
    { name: "JUNGLE GHOST", color: "#166534" },
    { name: "ARCTIC WOLF", color: "#f8fafc" },
    { name: "RECON ELITE", color: "#4ade80" },
    { name: "DESERT FOX", color: "#f59e0b" },
    { name: "NEON REAPER", color: "#a3ff12" },
    { name: "PLASMA VORTEX", color: "#c026d3" },
  ]
};

const MOVEMENT_SPEED = 260;
const FIRE_RATE = 380;
const JUMP_FORCE = 3;

export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 1.2,
};

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

const BULLET_PROPERTIES = {
  "GrenadeLauncher": { damage: 35, speed: 1.2, size: 0.5, range: 150, spread: 0.05, bullets: 8 },
  "AK": { damage: 10, speed: 1.5, size: 0.2, range: 100, spread: 0.01, bullets: 1 },
  "Knife_1": { damage: 25, speed: 1, size: 0.3, range: 5, spread: 0, bullets: 0 },
  "Knife_2": { damage: 30, speed: 1, size: 0.3, range: 5, spread: 0, bullets: 0 },
  "Pistol": { damage: 15, speed: 1.5, size: 0.2, range: 80, spread: 0.02, bullets: 1 },
  "Revolver": { damage: 20, speed: 1.4, size: 0.25, range: 90, spread: 0.01, bullets: 1 },
  "Revolver_Small": { damage: 18, speed: 1.4, size: 0.2, range: 80, spread: 0.02, bullets: 1 },
  "RocketLauncher": { damage: 50, speed: 1, size: 0.6, range: 200, spread: 0.05, bullets: 5 },
  "ShortCannon": { damage: 40, speed: 1, size: 0.5, range: 120, spread: 0.05, bullets: 1 },
  "SMG": { damage: 8, speed: 1.6, size: 0.15, range: 90, spread: 0.02, bullets: 1 },
  "Shotgun": { damage: 6, speed: 1.2, size: 0.2, range: 30, spread: 0.2, bullets: 3 },
  "Shovel": { damage: 20, speed: 1, size: 0.35, range: 3, spread: 0, bullets: 0 },
  "Sniper": { damage: 25, speed: 2, size: 0.4, range: 300, spread: 0, bullets: 1 },
  "Sniper_2": { damage: 30, speed: 2, size: 0.4, range: 300, spread: 0, bullets: 1 },
};


export const CharacterController = ({
  state,
  joystick,
  userPlayer,
  onKilled,
  onFire,
  downgradedPerformance,
  ...props
}) => {
  const selectedMode = useSelector((state) => state.authslice.selectedMode);

  // Knife Fight Mode: Lock to Knife
  const isKnifeFight = selectedMode === "Knife Fight";

  // Persistent Equipment Initialization
  const [weapon, setWeapon] = useState("AK");
  const [weaponIndex, setWeaponIndex] = useState(1);
  const [charColor, setCharColor] = useState("#4ade80");

  // Helper to get character color from name
  const getCharacterColor = (name) => {
    const char = itemsData.CHARACTERS.find(c => c.name === name);
    return char ? char.color : "#4ade80";
  };

  useEffect(() => {
    const storedEquipped = localStorage.getItem("stark_equipped");
    if (storedEquipped) {
      const gear = JSON.parse(storedEquipped);

      // Load Weapon
      const initialWeapon = isKnifeFight ? "Knife_1" : gear.WEAPONS;
      const initialIdx = WEAPONS.indexOf(initialWeapon);
      setWeapon(initialWeapon);
      setWeaponIndex(initialIdx !== -1 ? initialIdx : (isKnifeFight ? 2 : 1));

      // Load Character Color Locally
      setCharColor(getCharacterColor(gear.CHARACTERS));

      // Sync to network profile
      if (userPlayer) {
        state.setState("profile", {
          char: gear.CHARACTERS,
          weapon: initialWeapon,
          color: getCharacterColor(gear.CHARACTERS)
        });
      }
    }
  }, [isKnifeFight, userPlayer]);

  const group = useRef();
  const character = useRef();
  const rigidbody = useRef();
  const isDeadRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isDeadRef.current = state?.state?.dead || false;
  }, [state.state.dead]);

  let switchTimeout;
  const [animation, setAnimation] = useState("Idle");
  const lastShoot = useRef(0);
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false,
    jump: false,
  });
  const scene = useThree((state) => state.scene);
  const controls = useRef();
  const directionalLight = useRef();

  const spawnRandomly = () => {
    const spawns = [];
    for (let i = 0; i < 1000; i++) {
      const spawn = scene.getObjectByName(`spawn_${i}`);
      if (spawn) {
        spawns.push(spawn);
      } else {
        break;
      }
    }
    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)].position;
    rigidbody.current.setTranslation(spawnPos);
  };

  // Sync damage numbers across network for the shooter
  useEffect(() => {
    const lastDamage = state.state.lastDamage;
    const myId = myPlayer()?.id;

    // Only show damage if we are the shooter
    if (lastDamage && lastDamage.shooter === myId) {
      const { id, damage } = lastDamage;
      setDamageNumbers(prev => {
        // Avoid duplicates if effect runs multiple times for same ID
        if (prev.some(n => n.id === id)) return prev;
        return [...prev, { id, damage, timestamp: Date.now() }];
      });

      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(num => num.id !== id));
      }, 1000);
    }
  }, [state.state.lastDamage]);

  useEffect(() => {
    if (userPlayer) {
      spawnRandomly();
    }
  }, [userPlayer]);

  useEffect(() => {
    if (state.state.dead) {
      const audio = new Audio("/audios/dead.mp3");
      audio.volume = 0.5;
      audio.play();
    }
  }, [state.state.dead]);

  useEffect(() => {
    if (state.state.health < 100) {
      const audio = new Audio("/audios/hurt.mp3");
      audio.volume = 0.4;
      audio.play();
    }
  }, [state.state.health]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          setMovement((prev) => ({ ...prev, forward: true }));
          break;
        case "KeyS":
        case "ArrowDown":
          setMovement((prev) => ({ ...prev, backward: true }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setMovement((prev) => ({ ...prev, left: true }));
          break;
        case "KeyD":
        case "ArrowRight":
          setMovement((prev) => ({ ...prev, right: true }));
          break;
        case "KeyF":
          setMovement((prev) => ({ ...prev, fire: true }));
          break;
        case "Space":
          setMovement((prev) => ({ ...prev, jump: true }));
          break;
        case "KeyQ":
          if (!isKnifeFight) {
            console.log("press q working...!");
            setWeaponIndex((prev) => (prev + 1) % WEAPONS.length);
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          setMovement((prev) => ({ ...prev, forward: false }));
          break;
        case "KeyS":
        case "ArrowDown":
          setMovement((prev) => ({ ...prev, backward: false }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setMovement((prev) => ({ ...prev, left: false }));
          break;
        case "KeyD":
        case "ArrowRight":
          setMovement((prev) => ({ ...prev, right: false }));
          break;
        case "KeyF":
          setMovement((prev) => ({ ...prev, fire: false }));
          break;
        case "Space":
          setMovement((prev) => ({ ...prev, jump: false }));
          break;
        default:
          break;
      }
    };

    if (userPlayer) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      if (userPlayer) {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, [userPlayer]);

  useEffect(() => {
    setWeapon(WEAPONS[weaponIndex]);
  }, [weaponIndex]);

  useFrame((_, delta) => {
    // CAMERA FOLLOW
    if (controls.current) {
      const isTPP = selectedMode === "TPP";
      const cameraDistanceY = isTPP ? 4 : (window.innerWidth < 1024 ? 16 : 20);
      const cameraDistanceZ = isTPP ? 8 : (window.innerWidth < 1024 ? 12 : 16);

      const playerWorldPos = vec3(rigidbody.current.translation());
      controls.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + (state.state.dead ? 12 : cameraDistanceY),
        playerWorldPos.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPos.x,
        playerWorldPos.y + 1.5,
        playerWorldPos.z,
        true
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }

    // Movement Logic
    const movementAngle = () => {
      if (movement.forward && movement.right) return (3 * Math.PI) / 4;
      if (movement.forward && movement.left) return (5 * Math.PI) / 4;
      if (movement.backward && movement.right) return Math.PI / 4;
      if (movement.backward && movement.left) return -(Math.PI / 4);
      if (movement.forward) return Math.PI;
      if (movement.backward) return 0;
      if (movement.left) return -(Math.PI / 2);
      if (movement.right) return Math.PI / 2;
      return null;
    };

    const applyMovement = (angle) => {
      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      };
      rigidbody.current.applyImpulse(impulse, true);

      character.current.rotation.y = angle;
    };

    let finalAngle = null;
    let isMoving = false;

    // 1. Check Joystick Input
    if (joystick && joystick.isJoystickPressed()) {
      finalAngle = joystick.angle();
      isMoving = true;
    }
    // 2. Check Keyboard Input (as fallback or primary if no joystick)
    else {
      const kbdAngle = movementAngle();
      if (kbdAngle !== null) {
        finalAngle = kbdAngle;
        isMoving = true;
      }
    }

    // Apply movement and animation
    if (isMoving && finalAngle !== null) {
      setAnimation("Run");
      applyMovement(finalAngle);
    } else {
      setAnimation("Idle");
    }

    const playerWorldPos = vec3(rigidbody.current.translation());

    // Weapon Switch
    const switchPressed = joystick ? joystick.isPressed("switch") : false;
    if ((switchPressed || movement.switch) && !isKnifeFight) {
      if (!switchTimeout) {
        switchTimeout = setTimeout(() => {
          setWeaponIndex((prev) => (prev + 1) % WEAPONS.length);
          switchTimeout = null;
        }, 200);
      }
    }

    // Jump Logic
    const jumpPressed = joystick ? joystick.isPressed("jump") : false;
    if ((jumpPressed || movement.jump) && playerWorldPos.y < 2) {
      setAnimation("Jump");
      const angleForJump = finalAngle !== null ? finalAngle : character.current.rotation.y;
      const jumpImpulse = {
        x: 0,
        y: JUMP_FORCE,
        z: 0,
      };
      rigidbody.current.applyImpulse(jumpImpulse, true);
    } else if (playerWorldPos.y > 0) {
      // Small downward force to stick to ground or fall faster
      rigidbody.current.applyImpulse({ x: 0, y: -2, z: 0 }, true);
    }

    // Fire Logic
    const firePressed = joystick ? joystick.isPressed("fire") : false;
    if (firePressed || movement.fire) {
      setAnimation(isMoving ? "Run_Shoot" : "Idle_Shoot");

      if (Date.now() - lastShoot.current > FIRE_RATE) {
        lastShoot.current = Date.now();
        const bulletProps = BULLET_PROPERTIES[weapon] || {};
        const { damage = 10, speed = 1, size = 0.2, range = 100, spread = 0, bullets = 1 } = bulletProps;

        for (let i = 0; i < bullets; i++) {
          const newBullet = {
            id: state.id + "-" + Date.now() + "-" + i,
            position: vec3(rigidbody.current.translation()),
            angle: character.current.rotation.y + (spread ? (Math.random() - 0.5) * spread : 0),
            player: state.id,
            damage: damage,
            speed: speed,
            size: size,
            range: range,
          };
          onFire(newBullet);
        }
      }
    }

    // Sync State
    if (userPlayer) {
      state.setState("pos", rigidbody.current.translation());
      state.setState("rotY", character.current.rotation.y);
      state.setState("animation", animation);
      state.setState("weapon", weapon);
    } else {
      const pos = state.getState("pos");
      const rotY = state.getState("rotY");
      const netAnim = state.getState("animation");
      const netWeapon = state.getState("weapon");

      if (pos) rigidbody.current.setTranslation(pos);
      if (rotY !== undefined) character.current.rotation.y = rotY;
      if (netAnim !== undefined) setAnimation(netAnim);
      if (netWeapon !== undefined) setWeapon(netWeapon);
    }
  });

  useEffect(() => {
    if (character.current && userPlayer) {
      directionalLight.current.target = character.current;
    }
  }, [character.current]);

  const [damageNumbers, setDamageNumbers] = useState([]);

  return (
    <group {...props} ref={group}>
      {userPlayer && <CameraControls ref={controls} />}
      <RigidBody
        ref={rigidbody}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={userPlayer ? "dynamic" : "kinematicPosition"}
        userData={{ type: "player", id: state.id }}
        onIntersectionEnter={({ other }) => {
          if (
            other.rigidBody.userData.type === "bullet" &&
            other.rigidBody.userData.player !== state.id
          ) {
            // Only the local player handles their own damage
            if (!userPlayer) return;

            // Prevent multiple deaths from simultaneous bullet hits
            if (isDeadRef.current || state.state.dead) return;

            const damage = other.rigidBody.userData.damage;
            // Calculate new health locally first
            const currentHealth = state.state.health;
            const newHealth = currentHealth - damage;

            // Broadcast hit event so shooter sees the number
            state.setState("lastDamage", {
              id: Date.now() + Math.random(),
              damage: damage,
              shooter: other.rigidBody.userData.player
            }, true);

            if (newHealth <= 0) {
              // Immediately mark as dead locally to block other bullets in this frame
              isDeadRef.current = true;

              // Death count is handled in onKilled callback to prevent duplicates
              // state.setState("deaths", state.state.deaths + 1); 
              state.setState("dead", true);
              state.setState("health", 0);
              state.setState("killStreak", 0);
              rigidbody.current.setEnabled(false);
              setTimeout(() => {
                spawnRandomly();
                rigidbody.current.setEnabled(true);
                state.setState("health", 100);
                state.setState("dead", false);
                isDeadRef.current = false; // Reset local ref
                setDamageNumbers([]); // Clear floating damage numbers
                setAnimation("Idle"); // Force reset animation
              }, 2000);
              onKilled(state.id, other.rigidBody.userData.player);
            } else {
              state.setState("health", newHealth);
            }
          }
        }}
      >
        <PlayerInfo state={state.state} />
        {damageNumbers.map((num) => {
          const elapsed = Date.now() - num.timestamp;
          const opacity = Math.max(0, 1 - elapsed / 1000); // Linear fade out over 1s
          if (opacity <= 0) return null; // Don't render if fully transparent

          return (
            <Billboard key={num.id} position-y={3 + elapsed * 0.002}>
              <Text
                fontSize={0.5}
                color="#FF3E55"
                font="/game.ttf"
                fillOpacity={opacity} // Fade out
                outlineOpacity={opacity}
              >
                -{num.damage}
              </Text>
            </Billboard>
          );
        })}
        <group ref={character}>
          <CharacterSoldier
            color={state.state.profile?.color || charColor}
            animation={animation}
            weapon={state.state.weapon || weapon}
          />
          {userPlayer && (
            <Crosshair
              position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]}
            />
          )}
        </group>
        {userPlayer && (
          <directionalLight
            ref={directionalLight}
            position={[25, 18, -25]}
            intensity={0.3}
            castShadow={!downgradedPerformance}
            shadow-camera-near={0}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
        )}
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.6}>
      <Text position-y={0.45} fontSize={0.3} font="/game.ttf">
        {name}
        <meshBasicMaterial color={state.profile.color} />
      </Text>

      {/* Background Rail */}
      <mesh position-y={0.1} position-z={-0.01}>
        <planeGeometry args={[1.2, 0.15]} />
        <meshBasicMaterial color="black" transparent opacity={0.6} />
      </mesh>

      {/* Health Rail */}
      <mesh scale-x={health / 100} position-x={-0.6 * (1 - health / 100)} position-y={0.1}>
        <planeGeometry args={[1.2, 0.15]} />
        <meshBasicMaterial color={health < 30 ? "#FF3E55" : "#A3FF12"} />
      </mesh>

      {/* Percentage Readout */}
      <Text position-y={0.1} position-z={0.02} fontSize={0.12} font="/game.ttf">
        {Math.round(health)}%
        <meshBasicMaterial color="white" />
      </Text>
    </Billboard>
  );
};

const Crosshair = (props) => {
  return (
    <group {...props}>
      <mesh position-z={1}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.9} />
      </mesh>
      <mesh position-z={2}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.85} />
      </mesh>
      <mesh position-z={3}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" transparent opacity={0.8} />
      </mesh>

      <mesh position-z={4.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.7} transparent />
      </mesh>

      <mesh position-z={6.5}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.6} transparent />
      </mesh>

      <mesh position-z={9}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="black" opacity={0.2} transparent />
      </mesh>
    </group>
  );
};