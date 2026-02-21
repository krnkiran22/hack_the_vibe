import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import starsvg from "../assets/star.svg";
import left from "../assets/left.svg";
import right from "../assets/right.svg";
import icon from "../assets/icon.svg";
import icon1 from "../assets/icon1.svg";
import icon2 from "../assets/icon2.svg";
import icon3 from "../assets/icon3.svg";
import icon4 from "../assets/icon4.svg";
import icon5 from "../assets/icon5.svg";
import play from "../assets/play.svg";
import g1 from "../assets/g1.svg";
import g2 from "../assets/g2.svg";
import g3 from "../assets/g3.svg";
import g4 from "../assets/g4.png";
import g5 from "../assets/g5.svg";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";

const textStyle = {
  fontSize: "2.5rem",
  width: "15rem",
  textAlign: "center",
  fontWeight: "bold",
  color: "#fff",
  textShadow:
    "0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 20px #00ff00, 0 0 25px #00ff00, 0 0 30px #00ff00, 0 0 35px #00ff00",
  animation: "glow 1.5s infinite alternate",
};

const glowKeyframes = `
  @keyframes glow {
    from {
      text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 20px #00ff00, 0 0 25px #00ff00, 0 0 30px #00ff00, 0 0 35px #00ff00;
    }
    to {
      text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00, 0 0 50px #00ff00, 0 0 60px #00ff00, 0 0 70px #00ff00;
    }
  }
`;

function Home() {
  const ad1 = useSelector((state) => state.authslice.address);
  console.log("ad1",ad1);
useEffect(()=>{
const address = localStorage.getItem("Address")
console.log("address",address);


},[])
  
  return (
    <div className="bg-[#E6E6FF] pb-10">
      <main className="min-h-screen  bg-cover bg-center relative overflow-hidden">
        <Navbar />
        <div className="mx-8 py-5 bg-[#CCD5FF]  border-[6px] mt-[150px] h-[680px] rounded-3xl border-[#161B32]">
          <div className="text-container z-1 md:block hidden left-[3%] md:top-[20%] md:left-[10%] md:width-[100%]  shooter-game-ui">
            <div className="flex mt-8">
              <img
                src="./starknet.svg"
                alt="Starkshoot"
                className="h-28 w-auto"
              />
              <p className="gamefont text-[#E6E6FF] py-3 px-6 rounded-xl text-8xl bg-[#161B32] mx-auto">
                {" "}
                Starkshoot!
              </p>
            </div>
            <p className="herotxt text-[50px] opacity-70  md:text-[80px]">
              A New Era &nbsp; &nbsp; &nbsp; Multiplayer
            </p>
            <p className="herotxt text-xl opacity-70 md:text-[80px]">
              Onchain &nbsp; &nbsp; &nbsp; &nbsp; Adventure
            </p>
          </div>
          <div className="text-container   z-10 md:hidden block  left-[8%] top-[45%] md:left-[10%] width-[100%]  shooter-game-ui">
            <p className="herotxtd text-[50px] md:text-[120px]">
              A New Era Multiplayer
            </p>
            <p className="herotxtd text-[50px] md:text-[120px]">
              Onchain Adventure
            </p>
          </div>
          <img
            src="./hero.svg"
            alt="Hero Background"
            className="herobg left-[5%]  lumina h-[70%] md:left-[34%] md:top-[28%]"
          />
          <div className="additional-content top-[100%] right-[7%] w-[300px] md:top-[70%] md:right-[4%] md:w-[380px]">
            <p className="text-[#161B32] bg-[#161B32] px-4 py-1 rounded-full bg-opacity-5 text-lg mcfont">
              Pushing the Limits of Onchain Gaming
            </p>
            <p className="text-[#161B32] mcfont my-3 text-[15px]">
              Immerse yourself in the future of gaming on the Starknet.
              Experience epic PvP battles, earn exclusive NFT rewards, and
              embrace gaming realism like never before.
            </p>
            <button className="w-full">
              <p className="bg-[#161B32] gamefont px-10 w-full py-2 rounded-full text-[#E6E6FF] ">
                Play Now!
              </p>
            </button>
          </div>
        </div>
      </main>
      <div>
        <hr className="border-[#E6E6FF]  mt-20 -rotate-3" />
        <div className="running-text-container bg-[#161B32] -rotate-3">
          <div className="running-text flex gap-3  items-center">
            <span className="text-[#E6E6FF] hrtxt md:text-3xl text-lg mr-2">
              Experience the Future of Gaming on the Starknet!
            </span>
            <img
              src={starsvg}
              alt="star"
              className="inline-block md:w-auto -mt-2 md:h-6 h-10 w-10 mr-2"
            />
            <span className="text-[#E6E6FF] hrtxt  md:text-3xl text-lg mr-2">
              Dynamic Challenges Await – Are You Ready to Conquer?
            </span>
            <img
              src={starsvg}
              alt="star"
              className="inline-block md:w-auto  -mt-2 md:h-6 h-10 w-10 mr-2"
            />
            <span className="text-[#E6E6FF] hrtxt md:text-3xl text-lg mr-2">
              Join Now and Prove Your Skills!
            </span>
            <img
              src={starsvg}
              alt="star"
              className="inline-block md:w-auto  -mt-2 md:h-6 h-10 w-10 mr-2"
            />
            <span className="text-[#E6E6FF] hrtxt md:text-3xl text-lg mr-2">
              Experience the Future of Gaming on the Starknet!
            </span>
            <img
              src={starsvg}
              alt="star"
              className="inline-block md:w-auto  -mt-2 md:h-6 h-10 w-10 mr-2"
            />
            <span className="text-[#E6E6FF] hrtxt md:text-3xl text-lg mr-2">
              Dynamic Challenges Await – Are You Ready to Conquer?
            </span>
            <img
              src={starsvg}
              alt="star"
              className="inline-block md:w-auto  -mt-2 md:h-6 h-10 w-10 mr-2"
            />
            <span className="text-[#E6E6FF] hrtxt md:text-3xl text-lg mr-2">
              Join Now and Prove Your Skills!
            </span>
            <img
              src={starsvg}
              alt="star"
              className="inline-block md:w-auto  -mt-2  h-6 w-10 mr-2"
            />
          </div>
        </div>
        <hr className="border-[#E6E6FF] -rotate-3" />
      </div>
      <div>
        <style jsx>{`
          @keyframes wobble {
            0%,
            100% {
              transform: translateX(0) rotate(0deg);
            }
            15% {
              transform: translateX(-5px) rotate(-5deg);
            }
            30% {
              transform: translateX(5px) rotate(5deg);
            }
            45% {
              transform: translateX(-5px) rotate(-5deg);
            }
            60% {
              transform: translateX(5px) rotate(5deg);
            }
            75% {
              transform: translateX(-5px) rotate(-5deg);
            }
            90% {
              transform: translateX(5px) rotate(5deg);
            }
          }

          .wobble-effect-ui {
            animation: wobble 1s infinite ease-in-out;
          }
        `}</style>

        <div className="text-center mx-80 ">
          <p className=" mcfont text-[17px] mt-20 text-[#161B32]">
            WELCOME TO STELLAR STRIKE
          </p>
          <p className="text-[#161B32] mt-5 text-7xl gamefont ">
            <span className="text-[#161B32] opacity-[38%]">
              {" "}
              Lead the charge in{" "}
            </span>
            Onchain gaming,{" "}
            <span className="text-[#161B32] opacity-[38%]">with</span> Starknet
            <span className="text-[#161B32] opacity-[38%]">at your side.</span>
          </p>
        </div>
      </div>
      <div>
        <p>THE GAME</p>
      </div>
    </div>
  );
}

export default Home;
