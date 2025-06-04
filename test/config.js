require('dotenv').config();
 const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

module.exports = {

   
    neon_faucet: {
        curvestand: {
            url: "https://curve-stand.neontest.xyz/request_neon",
            min_balance: "10000",
        },
        neondevnet: {
            url: "https://api.neonfaucet.org/request_neon",
            min_balance: "100",
        },
        neonmainnet: {
            url: "",
            min_balance: "0",
        },
    },
    evm_sol_node: {
        curvestand: "https://curve-stand.neontest.xyz/SOL",
        neondevnet: "https://devnet.neonevm.org/SOL",
        neonmainnet: "https://neonevm.org/SOL",
    },
    svm_node: {
    curvestand: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    neondevnet: `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    neonmainnet: `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
},
    composability: {
    DAOVotingSystem: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        },
      
        CallSPLTokenProgram: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        },
        CallMetaplexProgram: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        },
       
        tokenMintSeed: {
            curvestand: "myTokenMintSeed",
            neondevnet: "myTokenMintSeed",
            neonmainnet: "myTokenMintSeed",
        },
        tokenMintDecimals: {
            curvestand: 9,
            neondevnet: 9,
            neonmainnet: 9,
        },
        tokenMetadata: {
            curvestand: {
                tokenName: "Test token",
                tokenSymbol: "TEST_0",
                uri: "https://my-test-token.fi/logo.png"
            },
            neondevnet: {
                tokenName: "Test token",
                tokenSymbol: "TEST_0",
                uri: "https://my-test-token.fi/logo.png"
            },
            neonmainnet: {
                tokenName: "Test token",
                tokenSymbol: "TEST_0",
                uri: "https://my-test-token.fi/logo.png"
            },
        }
    },
    token: {
        ERC20ForSplFactory: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        },
        ERC20ForSpl: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        },
        ERC20ForSplTokenMint: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        },
        MockVault: {
            curvestand: "",
            neondevnet: "",
            neonmainnet: "",
        }
    }
}

