'use client';
import React from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { base } from 'viem/chains';
import '@coinbase/onchainkit/styles.css';

import { Address } from '@coinbase/onchainkit/identity';

import { Avatar } from '@coinbase/onchainkit/identity';
 
import { Name } from '@coinbase/onchainkit/identity';


const queryClient = new QueryClient(); 

function OnchainKitEx() {
  return (
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey="8QqQGg5kIhSA153zcMqVpJtJXAsRAetA"
          chain={base}
        >
          <h1>hello</h1>
    <QueryClientProvider client={queryClient}>
        {/* ENS Domain name avatar */}
        <Avatar address="0xB022BDdd12168BaaB3022E87500d2C71E8109264" className="bg-white rounded-full" />
        <Avatar
            address="0x1234567890abcdef1234567890abcdef12345678"
            loadingComponent={( 
                <div className="h-8 w-8">
                <svg width="100%" height="100%" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="6,1 14,1 19,6 19,14 14,19 6,19 1,14 1,6" fill="yellow" stroke="yellow" stroke-width="1"/>
                </svg>
                </div> 
            )}
            defaultComponent={( 
                <div className="h-8 w-8">
                <svg width="100%" height="100%" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="6,1 14,1 19,6 19,14 14,19 6,19 1,14 1,6" fill="green" stroke="green" stroke-width="1"/>
                </svg>
                </div> 
            )}
            />
            <Name address="0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1" />
    </QueryClientProvider>

        </OnchainKitProvider>
      </QueryClientProvider>
  );
}

export default OnchainKitEx;
