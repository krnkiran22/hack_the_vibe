import React, { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Canvas, useGraph } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, Stage, useGLTF } from "@react-three/drei";
import { CharacterSoldier } from "./CharacterSoldier";

const itemsData = {
  CHARACTERS: [
    { name: "SHADOW ELITE", price: "FREE", color: "#000000", power: "STEALTH + 15%", desc: "The ultimate stealth operative, merging with shadows for lethal efficiency." },
    { name: "URBAN STRIKER", price: "FREE", color: "#3b82f6", power: "ACCURACY + 10%", desc: "City combat specialist with unmatched precision in close quarters." },
    { name: "JUNGLE GHOST", price: "FREE", color: "#166534", power: "STAMINA + 15%", desc: "Endurance expert trained in deep-forest survival operations." },
    { name: "ARCTIC WOLF", price: "FREE", color: "#f8fafc", power: "REGEN + 2%/sec", desc: "Tough survivor optimized for sub-zero medical recovery." },
    { name: "RECON ELITE", price: "50 XLM", color: "#4ade80", power: "SPEED + 10%", desc: "Highly agile scout specialized in rapid deployment." },
    { name: "DESERT FOX", price: "75 XLM", color: "#f59e0b", power: "DURABILITY + 15%", desc: "Heavy mercenary built to survive high-impact environments." },
    { name: "NEON REAPER", price: "120 XLM", color: "#a3ff12", power: "DAMAGE + 15%", desc: "Experimental cyber-soldier with ultra-lethal efficiency." },
    { name: "PLASMA VORTEX", price: "180 XLM", color: "#c026d3", power: "SHIELD + 20%", desc: "High-tech vanguard equipped with energy-deflection armor." },
  ],
  WEAPONS: [
    { name: "AK", price: "FREE", stats: { dmg: 40, rate: 80, range: 60 }, desc: "Reliable Soviet-bloc assault rifle. Balanced for all engagements." },
    { name: "Sniper", price: "90 XLM", stats: { dmg: 95, rate: 10, range: 95 }, desc: "High-precision bolt-action rifle for long-range elimination." },
    { name: "Sniper_2", price: "120 XLM", stats: { dmg: 98, rate: 15, range: 98 }, desc: "Advanced tactical sniper with integrated noise suppressor." },
    { name: "RocketLauncher", price: "150 XLM", stats: { dmg: 100, rate: 5, range: 50 }, desc: "Heavy ordinance launcher for maximum area damage." },
    { name: "GrenadeLauncher", price: "FREE", stats: { dmg: 90, rate: 15, range: 40 }, desc: "Tactical explosive projector for clearing rooms." },
    { name: "SMG", price: "FREE", stats: { dmg: 30, rate: 95, range: 40 }, desc: "Submachine gun with extreme fire rate for close encounters." },
    { name: "Shotgun", price: "80 XLM", stats: { dmg: 85, rate: 20, range: 20 }, desc: "Devastating close-quarters power with wide pellet spread." },
    { name: "Pistol", price: "FREE", stats: { dmg: 25, rate: 60, range: 30 }, desc: "Standard sidearm. Light, reliable, and fast to equip." },
    { name: "Revolver", price: "40 XLM", stats: { dmg: 50, rate: 30, range: 45 }, desc: "High-caliber handgun for precise, powerful shots." },
    { name: "Revolver_Small", price: "FREE", stats: { dmg: 45, rate: 35, range: 40 }, desc: "Compact high-power revolver for quick draws." },
    { name: "ShortCannon", price: "110 XLM", stats: { dmg: 95, rate: 10, range: 35 }, desc: "Miniaturized artillery pieces for massive short-range impact." },
    { name: "Knife_1", price: "FREE", stats: { dmg: 35, rate: 85, range: 5 }, desc: "Standard tactical combat knife for silent eliminations." },
    { name: "Knife_2", price: "25 XLM", stats: { dmg: 45, rate: 90, range: 5 }, desc: "Shadow-ops karambit designed for rapid lethal strikes." },
    { name: "Shovel", price: "FREE", stats: { dmg: 30, rate: 50, range: 10 }, desc: "Rugged trench tool utilized as a desperate melee weapon." },
  ],
  MAPS: [
    { name: "bermuda", price: "FREE", model: "/models/map.glb", desc: "Classic combat zone with open terrain and strategic cover." },
    { name: "pochinki", price: "FREE", model: "/models/city_side_map.glb", desc: "Dense urban environment optimized for high-risk city combat." },
    { name: "knife fight map", price: "FREE", model: "/models/knife_fight_map.glb", desc: "Close-quarters arena designed for pure melee mastery." },
    { name: "free arena", price: "FREE", model: "/models/map.glb", desc: "Symmetrical training ground with varied elevations." },
    { name: "city side map", price: "40 XLM", model: "/models/city_side_map.glb", desc: "Metropolitan zone featuring vertical gameplay opportunities." },
    { name: "living room", price: "40 XLM", model: "/models/living_room.glb", desc: "Intricate indoor environment for tactical CQB." },
    { name: "grave house map", price: "40 XLM", model: "/models/grave_house_map.glb", desc: "Atmospheric, low-visibility stealth combat theater." },
    { name: "broken house map", price: "40 XLM", model: "/models/broken_house_map.glb", desc: "Ruined sector with complex line-of-sight challenges." },
  ]
};

const MapPreview = ({ modelPath }) => {
  if (!modelPath) return (
    <group rotation-y={Math.PI / 4} position={[0, 0, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <gridHelper args={[10, 20, '#a3ff12', '#333']} />
    </group>
  );

  const { scene } = useGLTF(modelPath);
  return <primitive object={scene} scale={0.2} position={[0, 0, 0]} />;
};

const WeaponPreview = ({ weaponName }) => {
  const { scene } = useGLTF("/models/Character_Soldier.gltf");
  const { nodes } = useGraph(scene);
  const weaponNode = nodes[weaponName];

  if (!weaponNode) return null;

  return (
    <primitive
      object={weaponNode.clone()}
      scale={0.4}
      rotation={[0, Math.PI / 1.5, 0]}
      position={[-0.5, 0.5, 0]}
    />
  );
};

const StoreOptions = () => {
  const [activeTab, setActiveTab] = useState('CHARACTERS');
  const [selectedItem, setSelectedItem] = useState(itemsData['CHARACTERS'][0]);
  const [credits, setCredits] = useState(14250);
  const [ownedItems, setOwnedItems] = useState([]);
  const [equipped, setEquipped] = useState({
    CHARACTERS: "SHADOW ELITE",
    WEAPONS: "AK",
    MAPS: "bermuda"
  });

  // Persistence Logic
  useEffect(() => {
    // Load or Initialize Credits
    const storedCredits = localStorage.getItem("stark_credits");
    if (storedCredits) setCredits(parseInt(storedCredits));
    else localStorage.setItem("stark_credits", "14250");

    // Load or Initialize Owned Items (All FREE items owned by default)
    const storedOwned = localStorage.getItem("stark_owned_items");
    if (storedOwned) {
      setOwnedItems(JSON.parse(storedOwned));
    } else {
      const freeItems = [
        ...itemsData.CHARACTERS.filter(i => i.price === "FREE").map(i => i.name),
        ...itemsData.WEAPONS.filter(i => i.price === "FREE").map(i => i.name),
        ...itemsData.MAPS.filter(i => i.price === "FREE").map(i => i.name),
      ];
      setOwnedItems(freeItems);
      localStorage.setItem("stark_owned_items", JSON.stringify(freeItems));
    }

    // Load Equipped Gear
    const storedEquipped = localStorage.getItem("stark_equipped");
    if (storedEquipped) setEquipped(JSON.parse(storedEquipped));
    else localStorage.setItem("stark_equipped", JSON.stringify(equipped));
  }, []);

  const handleAction = () => {
    if (!selectedItem) return;

    const isOwned = ownedItems.includes(selectedItem.name);
    const isEquipped = equipped[activeTab] === selectedItem.name;

    if (isEquipped) {
      toast.info(`${selectedItem.name} IS ALREADY ACTIVE`);
      return;
    }

    if (isOwned) {
      // EQUIP LOGIC
      const newEquipped = { ...equipped, [activeTab]: selectedItem.name };
      setEquipped(newEquipped);
      localStorage.setItem("stark_equipped", JSON.stringify(newEquipped));

      // Sync Map Selection with Lobby's key
      if (activeTab === 'MAPS') {
        localStorage.setItem("selectedMap", selectedItem.name);
      }

      toast.success(`${selectedItem.name} DEPLOYED`);
    } else {
      // PURCHASE LOGIC
      const isFree = selectedItem.price === "FREE";
      const priceVal = isFree ? 0 : parseInt(selectedItem.price);

      if (isFree || credits >= priceVal) {
        const newCredits = isFree ? credits : credits - priceVal;
        const newOwned = [...ownedItems, selectedItem.name];
        const newEquipped = { ...equipped, [activeTab]: selectedItem.name };

        setCredits(newCredits);
        setOwnedItems(newOwned);
        setEquipped(newEquipped);

        localStorage.setItem("stark_credits", newCredits.toString());
        localStorage.setItem("stark_owned_items", JSON.stringify(newOwned));
        localStorage.setItem("stark_equipped", JSON.stringify(newEquipped));

        if (activeTab === 'MAPS') {
          localStorage.setItem("selectedMap", selectedItem.name);
        }

        toast.success(isFree ? `${selectedItem.name} EQUIPPED` : `${selectedItem.name} AUTHORIZED`);
      } else {
        toast.error("INSUFFICIENT CREDITS // TRANSACTION ABORTED");
      }
    }
  };

  const isOwned = (name) => {
    if (ownedItems.includes(name)) return true;
    // Cross-check itemsData for FREE status
    for (const category in itemsData) {
      const item = itemsData[category].find(i => i.name === name);
      if (item && item.price === "FREE") return true;
    }
    return false;
  };
  const isSelected = (name) => equipped[activeTab] === name;

  return (
    <div className="h-screen w-screen bg-[#05070a] overflow-hidden flex flex-col relative font-['Rajdhani']">
      {/* ... (Previous Hud/Background) ... */}
      <div className="absolute inset-0 opacity-20 text-white pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(163,255,18,0.1)_0%,transparent_70%)] animate-pulse"></div>
      </div>

      <header className="px-12 py-8 flex justify-between items-center z-20 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-8">
          <Link to="/" className="group flex items-center space-x-3 text-white/40 hover:text-lime transition-all">
            <svg className="w-5 h-5 transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-black tracking-[0.3em] uppercase">Return to Base</span>
          </Link>
          <div className="h-8 w-px bg-white/10"></div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">QUARTERMASTER <span className="text-lime">STORE</span></h1>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Available Credits</span>
            <div className="text-2xl font-black text-lime tracking-tighter tabular-nums flex items-center">
              <span className="text-xs mr-2">XLM</span> {credits.toLocaleString()}
            </div>
          </div>
          <div className="w-12 h-12 bg-lime/10 border border-lime/20 flex items-center justify-center">
            <span className="text-lime">⚡</span>
          </div>
        </div>
      </header>

      <div className="flex-grow flex p-8 gap-8 overflow-hidden z-10">
        <aside className="w-24 flex flex-col space-y-4">
          {Object.keys(itemsData).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedItem(itemsData[tab][0]);
              }}
              className={`h-24 w-full flex flex-col items-center justify-center space-y-2 transition-all duration-500 border-l-4 ${activeTab === tab
                ? 'bg-lime/10 border-lime text-lime'
                : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'
                }`}
            >
              <span className="text-[10px] font-black tracking-[0.2em] -rotate-90 origin-center whitespace-nowrap">{tab}</span>
            </button>
          ))}
        </aside>

        <div className="w-96 flex flex-col space-y-3 overflow-y-auto pr-4 custom-scrollbar">
          <div className="text-[10px] text-white/30 font-black tracking-widest uppercase mb-2">Available Equipment</div>
          {itemsData[activeTab].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedItem(item)}
              className={`group p-5 flex items-center justify-between border transition-all duration-300 ${selectedItem?.name === item.name
                ? 'bg-lime/20 border-lime/50 translate-x-3'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)' }}
            >
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center space-x-2">
                  <span className={`text-[8px] font-bold tracking-[0.2em] ${selectedItem?.name === item.name ? 'text-lime' : 'text-white/30'}`}>
                    0{idx + 1} //
                  </span>
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider ${isSelected(item.name)
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : isOwned(item.name)
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      : "bg-white/5 text-white/40 border border-white/10"
                    }`}>
                    {isSelected(item.name) ? "EQUIPPED" : isOwned(item.name) ? "OWNED" : "LOCKED"}
                  </div>
                  {isSelected(item.name) && <span className="w-1 h-1 bg-lime rounded-full animate-pulse"></span>}
                </div>
                <span className="text-xl font-black text-white italic tracking-tighter uppercase">{item.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-white/40 uppercase mb-1">
                  {isOwned(item.name) ? 'VERIFIED' : 'MARKET'}
                </span>
                <span className={`text-sm font-black ${isOwned(item.name) ? 'text-cyan' : 'text-lime'}`}>
                  {isOwned(item.name) ? 'COLLECTED' : item.price}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-grow relative flex flex-col space-y-8">
          <div className="flex-grow bg-white/5 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 z-0">
              <Canvas shadows camera={{ position: [0, 1, 5], fov: 40 }} gl={{ powerPreference: "high-performance" }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[5, 5, 5]} intensity={0.8} />
                <spotLight position={[-5, 5, 5]} angle={0.15} penumbra={1} intensity={0.5} />
                <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
                  <Stage
                    intensity={activeTab === 'MAPS' ? 1.5 : 0.5}
                    environment="city"
                    adjustCamera={activeTab === 'MAPS' ? 0.9 : 1.2}
                    contactShadow={true}
                  >
                    <Suspense fallback={null}>
                      {activeTab === 'CHARACTERS' && (
                        <CharacterSoldier
                          color={selectedItem?.color || "#4ade80"}
                          animation="Idle"
                          position={[0, -1, 0]}
                          scale={1}
                        />
                      )}
                      {activeTab === 'WEAPONS' && (
                        <WeaponPreview weaponName={selectedItem?.name} />
                      )}
                      {activeTab === 'MAPS' && (
                        <MapPreview modelPath={selectedItem?.model} />
                      )}
                    </Suspense>
                  </Stage>
                </PresentationControls>
                <Environment preset="night" />
              </Canvas>
            </div>

            <div className="absolute top-8 left-8 p-8 border border-white/10 bg-black/60 backdrop-blur-xl w-80 pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 10% 100%, 0 100%)' }}>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-lime font-black tracking-[0.4em] uppercase mb-2">Item Specifications</div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedItem?.name || "Initializing..."}</h2>
                </div>

                <div className="h-px bg-white/10"></div>

                <p className="text-sm text-white/50 leading-relaxed font-bold tracking-tight">
                  {selectedItem?.desc || "Strategic deployment asset verified for high-risk operations within the Stark ecosystem."}
                </p>

                {activeTab === 'CHARACTERS' && (
                  <div className="bg-lime/10 p-4 border-l-2 border-lime">
                    <div className="text-[8px] text-lime font-black uppercase tracking-widest mb-1">Unique Ability</div>
                    <div className="text-white font-black text-sm">{selectedItem.power}</div>
                  </div>
                )}

                {activeTab === 'WEAPONS' && selectedItem.stats && (
                  <div className="space-y-3">
                    {Object.entries(selectedItem.stats).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                          <span>{key}</span>
                          <span>{val}%</span>
                        </div>
                        <div className="h-1 bg-white/5 w-full">
                          <div className="h-full bg-lime shadow-[0_0_5px_#A3FF12]" style={{ width: `${val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className={`playbtm w-full p-4 pointer-events-auto transition-all ${isSelected(selectedItem?.name)
                    ? "opacity-50 cursor-not-allowed grayscale"
                    : "hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  onClick={handleAction}
                  disabled={isSelected(selectedItem?.name)}
                >
                  <span className="text-lg font-black italic tracking-widest uppercase">
                    {isSelected(selectedItem?.name)
                      ? 'CURRENTLY ACTIVE'
                      : isOwned(selectedItem?.name)
                        ? 'DEPLOY ASSET'
                        : `AUTHORIZE PURCHASE // ${selectedItem?.price}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Nav Indicators */}
            <div className="absolute bottom-8 right-8 flex space-x-4">
              <div className="flex flex-col items-end opacity-40">
                <div className="text-[8px] font-black text-white tracking-[0.5em] mb-1">DATA FLOW</div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-1 h-3 bg-lime animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreOptions;
