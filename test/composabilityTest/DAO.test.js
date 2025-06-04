const { network, ethers } = require("hardhat")
const { expect } = require("chai")
const web3 = require("@solana/web3.js")
const { getMint } = require("@solana/spl-token")
const config = require("../config.js")
const { deployContract } = require("./utils.js")

describe('\u{1F680} DAO Voting System Tests', function () {
    let deployer, neonEVMUser, DAOVotingSystem
    let solanaConnection
    let tokenMintBytes

    before(async function () {
        // Initialize Solana connection
        solanaConnection = new web3.Connection(config.svm_node[network.name], "processed")
        
        // Deploy with constructor argument
        const deployment = await deployContract(
            "DAOVotingSystem", 
            null, 
            [(await ethers.getSigners())[0].address]
        )
        
        deployer = deployment.deployer
        neonEVMUser = deployment.user
        DAOVotingSystem = deployment.contract

        // Initialize token and get mint address
        if (!(await DAOVotingSystem.tokenInitialized())) {
            await DAOVotingSystem.connect(deployer).initializeVotingToken(
                "ETH Belgrade Token",
                "EBH",
                9,
                "",
                false
            )
        }
        
        // Get token mint address for later use
        const encodedSeed = ethers.AbiCoder.defaultAbiCoder().encode(
            ["string"], 
            ["dao-voting-system"]
        )
        tokenMintBytes = await DAOVotingSystem.getTokenMintAccount(
            DAOVotingSystem.target,
            encodedSeed
        )
    })

    describe("Initialization", function () {
        it("Should deploy with correct admin", async function () {
            expect(await DAOVotingSystem.daoAdmin()).to.equal(deployer.address)
        })

        it("Should initialize voting token", async function () {
            expect(await DAOVotingSystem.tokenInitialized()).to.be.true
            
            // Convert bytes to Solana PublicKey
            const tokenMintPubKey = new web3.PublicKey(
                ethers.getBytes(tokenMintBytes)
            )
            
            // Verify on Solana
            const mintInfo = await getMint(solanaConnection, tokenMintPubKey)
            expect(mintInfo.decimals).to.equal(9)
            expect(mintInfo.isInitialized).to.be.true
        })
    })

    describe("Token Distribution", function () {
        it("Should distribute tokens", async function () {
            const recipient = ethers.Wallet.createRandom().address
            const recipientBytes = await DAOVotingSystem.getNeonAddress(recipient)
            
            await expect(
                DAOVotingSystem.connect(deployer).distributeVotingTokens(
                    [recipientBytes],
                    1000
                )
            ).to.emit(DAOVotingSystem, "TokensDistributed")
        })

        it("Should prevent non-admin from distributing tokens", async function () {
            const recipient = ethers.Wallet.createRandom().address
            const recipientBytes = await DAOVotingSystem.getNeonAddress(recipient)
            
            await expect(
                DAOVotingSystem.connect(neonEVMUser).distributeVotingTokens(
                    [recipientBytes],
                    1000
                )
            ).to.be.revertedWith("Unauthorized")
        })
    })

    describe("Proposal System", function () {
        it("Should create proposals", async function () {
            await expect(
                DAOVotingSystem.connect(deployer).createProposal(
                    "First Proposal",
                    3600 // 1 hour duration
                )
            ).to.emit(DAOVotingSystem, "ProposalCreated")
        })

        it("Should prevent non-admin from creating proposals", async function () {
            await expect(
                DAOVotingSystem.connect(neonEVMUser).createProposal(
                    "Unauthorized Proposal",
                    3600
                )
            ).to.be.revertedWith("Unauthorized")
        })
    })
})