import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import navicon from "../assets/navicon.png";
import Link from "next/link";
import { connect, disconnect } from 'starknetkit'
import { useDispatch, useSelector } from "react-redux";
import { setAddress } from "../../store/authslice";

const navigation = [
  { name: "How it works", href: "https://stellarstrike.gitbook.io/home/" },
];



function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();

  const howitworks = () => {
    const section = document.getElementById("howitworks");
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };


  const connectWallet = async() => {
    const { wallet } = await connect();
   
    if(wallet && wallet.isConnected) {
  
      console.log("wallet.selectedAddress",wallet.selectedAddress);
      // setConnection(wallet)
      // setProvider(wallet.account)
      // setAddress(wallet.selectedAddress)
      dispatch(setAddress(wallet.selectedAddress));

      localStorage.setItem("address",wallet.selectedAddress)
    }
   }

  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 px-5 z-50">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-6 lg:px-8"
        >
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <p className="bg-[#161B32] gamefont px-4 py-3 text-xl rounded-full text-white">
                  {item.name}
                </p>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 border-[#161B32] border-[6px] px-4 py-2 rounded-full lg:flex">
            <p className="text-[#161B32] text-lg gamefont">Shop</p>
            <a href="#" className="-m-1.5 p-1.5">
              <img alt="Stellar Strike" src="./logo.svg" className="h-16 w-auto " />
            </a>
            <button>
              <p className="bg-[#161B32] gamefont px-5 py-2 rounded-full text-white ">
                Play!
              </p>
            </button>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:items-center lg:justify-end">
            <button onClick={connectWallet}>
              <p className="bg-[#161B32] gamefont px-5 text-xl py-3 rounded-full text-white ">
                Connect Wallet
              </p>
            </button>
          </div>
        </nav>
        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden"
        >
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#e79f2b] px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 p-1.5">
                <span className="sr-only">Stellar Strike</span>
                <img alt="Stellar Strike" src={navicon} className="h-10 w-auto" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link className="flex" key={item.name} href={item.href}>
                      <p className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-800">
                        {item.name}
                      </p>
                    </Link>
                  ))}
                </div>
            
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </div>
  );
}

export default Navbar;
