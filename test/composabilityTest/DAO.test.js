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
    let initialized = false

    before(async function () {
        this.timeout(60000) // Increase timeout for Solana operations
        
        solanaConnection = new web3.Connection(config.svm_node[network.name], "processed")
        
        // Deploy contract
        const deployment = await deployContract(
            "DAOVotingSystem", 
            null, 
            [(await ethers.getSigners())[0].address]
        )
        
        deployer = deployment.deployer
        neonEVMUser = deployment.user
        DAOVotingSystem = deployment.contract
    })

    describe("Initialization", function () {
        it("Should deploy with correct admin", async function () {
            expect(await DAOVotingSystem.daoAdmin()).to.equal(deployer.address)
        })

        it("Should initialize voting token", async function () {
            const tx = await DAOVotingSystem.connect(deployer).initializeVotingToken(
                "ETH Belgrade Token",
                "EBH",
                9,
                "",
                false
            )
            await tx.wait()

            initialized = true
            
            // Get token mint account bytes
            const encodedSeed = ethers.AbiCoder.defaultAbiCoder().encode(
                ["string"], 
                ["dao-voting-system"]
            )
            tokenMintBytes = await DAOVotingSystem.getTokenMintAccount(
                DAOVotingSystem.target,
                encodedSeed
            )
            
            // Verify initialization
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
        before(async function () {
            if (!initialized) {
                await DAOVotingSystem.connect(deployer).initializeVotingToken(
                    "ETH Belgrade Token",
                    "EBH",
                    9,
                    "",
                    false
                )
                initialized = true
            }
        })

        it("Should distribute tokens", async function () {
            const recipient = ethers.Wallet.createRandom().address
            const recipientBytes = await DAOVotingSystem.getNeonAddress(recipient)
            
            // First initialize the recipient account if needed
            try {
                await DAOVotingSystem.connect(deployer).distributeVotingTokens(
                    [recipientBytes],
                    1000
                )
                expect(true).to.be.true
            } catch (error) {
                console.error("Token distribution failed:", error)
                throw error
            }
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
            const tx = await DAOVotingSystem.connect(deployer).createProposal(
                "First Proposal",
                3600
            )
            const receipt = await tx.wait()
            
            expect(receipt).to.not.be.null
            await expect(tx)
                .to.emit(DAOVotingSystem, "ProposalCreated")
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