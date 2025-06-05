**🚀 Project Overview**

Blockchain ecosystems face several challenges such as liquidity fragmentation, cross-chain complexity, and performance limitations. Neon EVM solves these by enabling developers to write Solidity smart contracts that directly interact with Solana's blockchain.


# DAO Voting System with Solana SPL Token Integration : Composability DAO

A cross-chain DAO voting system that combines Ethereum/Solidity smart contracts with Solana Program Library (SPL) tokens for voting power, deployed on Neon EVM.
## Features

****Deployed Contract ****

───────────────────────────────
│ 0x180A435D519BFf48cE05898c4809a33942ACf6c5 │
───────────────────────────────

- 🗳️ **Proposal Management**: Create and manage DAO proposals with configurable voting periods
- 💰 **SPL Token Voting**: Voting power based on Solana SPL token balances
- 🌉 **Cross-Chain**: Ethereum smart contracts interacting with Solana token program
- 📜 **Metaplex Metadata**: Token metadata stored on Solana using Metaplex standard
- 🔐 **Admin Controls**: Restricted functions for DAO administrators

  ## Technology Stack

- **Smart Contracts**: Solidity 0.8.28
- **EVM Compatibility**: Neon EVM for Composability
- **Token Standard**: Solana SPL Token
- **Metadata**: Metaplex Token Metadata Program
- **Testing**: Hardhat, Chai, Mocha

## Contracts

### DAOVotingSystem.sol

The main contract that manages:
- SPL token creation and distribution
- Proposal creation and voting
- Vote tallying and results

### CallMetaplexProgram.sol

Handles interactions with Solana's Metaplex program for token metadata.


### CallSPLToken.sol



**🛠️ Installation & Deployment**
Clone this repo.

Install dependencies and configure your Solidity development environment.

Deploy the contract on Neon EVM compatible network.

Use the admin functions to initialize tokens and distribute voting rights.

Start creating proposals and allow token holders to vote.



**🧑‍💻 Usage**
Admin initializes the SPL token and distributes tokens.

Token holders use their SPL token account to vote on active proposals.

Proposals automatically close after the set duration.

DAO members can query the winning proposals and voting details.


**🔐 Security & Limitations**
Access control enforced: only admin can create proposals or distribute tokens.

Voting power strictly tied to SPL token balances.

Prevents double voting per proposal.

Voting only allowed while the proposal is active.

