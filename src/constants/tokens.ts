/**
 * Testnet token addresses and configurations
 */

export const TESTNET_TOKENS = {
  XLM: {
    code: 'XLM',
    issuer: null, // Native asset
    contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC', // Wrapped XLM on Soroban
    decimals: 7,
    name: 'Stellar Lumens',
  },
  USDC: {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    contractAddress: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA', // Soroban USDC
    decimals: 7,
    name: 'USD Coin',
  },
  AQUA: {
    code: 'AQUA',
    issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
    contractAddress: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
    decimals: 7,
    name: 'Aquarius',
  },
};

export const MAINNET_TOKENS = {
  XLM: {
    code: 'XLM',
    issuer: null,
    contractAddress: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    decimals: 7,
    name: 'Stellar Lumens',
  },
  USDC: {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', // Circle USDC on mainnet
    contractAddress: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    decimals: 7,
    name: 'USD Coin',
  },
  AQUA: {
    code: 'AQUA',
    issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
    contractAddress: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
    decimals: 7,
    name: 'Aquarius',
  },
  yXLM: {
    code: 'yXLM',
    issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW67G2P2NKCEAG6RDMFNMD2YVZXHV',
    contractAddress: null,
    decimals: 7,
    name: 'Yield XLM',
  },
};