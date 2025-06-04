// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import { Constants } from "../libraries/Constants.sol";
import { CallSolanaHelperLib } from '../utils/CallSolanaHelperLib.sol';
import {CallSPLTokenProgram} from "./CallSPLToken.sol";
import {LibSPLTokenData} from "../libraries/spl-token-program/LibSPLTokenData.sol";
import {LibMetaplexData} from "../libraries/metaplex-program/LibMetaplexData.sol";
import {CallMetaplexProgram} from "./CallMetaplexProgram.sol";


import { LibAssociatedTokenData } from "../libraries/associated-token-program/LibAssociatedTokenData.sol";
import { LibSystemData } from "../libraries/system-program/LibSystemData.sol";

import { LibSPLTokenErrors } from "../libraries/spl-token-program/LibSPLTokenErrors.sol";
import { LibSPLTokenProgram } from "../libraries/spl-token-program/LibSPLTokenProgram.sol";

contract DAOVotingSystem is CallSPLTokenProgram {
    // Voting state
    struct Proposal {
        string description;
        uint256 voteCount;
        uint64 endTime;
        mapping(bytes32 => bool) voters;
    }
    
    Proposal[] public proposals;
    bytes32 public votingTokenMint;
    bool public tokenInitialized;
    address public daoAdmin;
    
    // Events
    event VotingTokenCreated(bytes32 tokenMint, string name, string symbol);
    event TokensDistributed(bytes32 indexed toAccount, uint64 amount);
    event ProposalCreated(uint256 proposalId, string description, uint64 duration);
    event Voted(bytes32 indexed voterAccount, uint256 proposalId, uint64 weight);
    event VotingClosed(uint256 proposalId, uint256 totalVotes);
    
    // Errors
    error VotingTokenNotInitialized();
    error AlreadyVoted(bytes32 voterAccount);
    error NotTokenHolder();
    error InvalidProposal();
    error ProposalClosed();
    error TokenDistributionFailed();
    error Unauthorized();
    error VotingStillActive();

    modifier onlyAdmin() {
        require(msg.sender == daoAdmin, "Unauthorized");
        _;
    }

    constructor(address _admin) {
        daoAdmin = _admin;
    }

    /// @notice Initialize the voting token with metadata
    function initializeVotingToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        string memory tokenUri,
        bool isMutable
    ) external onlyAdmin {
        require(!tokenInitialized, "Token already initialized");
        
        // Create the SPL token mint
        bytes memory seed = abi.encodePacked("dao_voting_token", block.timestamp);
        this.createInitializeTokenMint(seed, decimals);
        votingTokenMint = getTokenMintAccount(address(this), seed);
        
        // Create metadata account
        this.createTokenMetadataAccount(seed, name, symbol, tokenUri, isMutable);
        
        tokenInitialized = true;
        emit VotingTokenCreated(votingTokenMint, name, symbol);
    }

function distributeVotingTokens(
    bytes32[] calldata recipientAccounts,
    uint64 amount
) external onlyAdmin {
    if (!tokenInitialized) revert VotingTokenNotInitialized();
    
    // Create a fixed 32-byte seed
    bytes32 mintSeed = keccak256(abi.encodePacked("voting_token"));
    
    for (uint i = 0; i < recipientAccounts.length; i++) {
        // Check if recipient account exists, create if not
        if (LibSPLTokenData.getSPLTokenAccountIsInitialized(recipientAccounts[i]) == false) {
            _initializeTokenAccount(recipientAccounts[i], votingTokenMint);
        }
        
        // Call mint with fixed 32-byte seed
        this.mint(abi.encode(mintSeed), recipientAccounts[i], amount);
        
        emit TokensDistributed(recipientAccounts[i], amount);
    }
}
    /// @notice Create a new voting proposal with duration
    function createProposal(
        string memory description, 
        uint64 durationInSeconds
    ) external onlyAdmin returns (uint256) {
        uint256 proposalId = proposals.length;
        Proposal storage newProposal = proposals.push();
        newProposal.description = description;
        newProposal.voteCount = 0;
        newProposal.endTime = uint64(block.timestamp) + durationInSeconds;
        
        emit ProposalCreated(proposalId, description, durationInSeconds);
        return proposalId;
    }

    /// @notice Cast a vote using an SPL token account
    function vote(bytes32 voterAccount, uint256 proposalId) external {
        if (!tokenInitialized) revert VotingTokenNotInitialized();
        if (proposalId >= proposals.length) revert InvalidProposal();
        
        Proposal storage proposal = proposals[proposalId];
        
        // Check if voting period has ended
        if (block.timestamp > proposal.endTime) revert ProposalClosed();
        
        // Check if already voted
        if (proposal.voters[voterAccount]) {
            revert AlreadyVoted(voterAccount);
        }
        
        // Verify token ownership and voting power
        uint64 votingPower = _getVotingPower(voterAccount);
        if (votingPower == 0) revert NotTokenHolder();
        
        // Record vote
        proposal.voteCount += votingPower;
        proposal.voters[voterAccount] = true;
        
        emit Voted(voterAccount, proposalId, votingPower);
    }

    /// @notice Close voting and determine results
    function closeVoting(uint256 proposalId) external {
        if (proposalId >= proposals.length) revert InvalidProposal();
        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp <= proposal.endTime) revert VotingStillActive();
        
        emit VotingClosed(proposalId, proposal.voteCount);
    }

    // ========== VIEW FUNCTIONS ========== //

    /// @notice Get the winning proposal (with most votes)
    function getWinningProposal() public view returns (
        uint256 winningProposalId,
        uint256 winningVoteCount,
        bool isTie
    ) {
        if (proposals.length == 0) {
            return (0, 0, false);
        }

        winningProposalId = 0;
        winningVoteCount = 0;
        isTie = false;

        // First pass to find highest vote count among closed proposals
        for (uint256 i = 0; i < proposals.length; i++) {
            if (block.timestamp > proposals[i].endTime && proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winningProposalId = i;
            }
        }

        // Second pass to check for ties
        uint256 winnersCount = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (block.timestamp > proposals[i].endTime && proposals[i].voteCount == winningVoteCount) {
                winnersCount++;
                if (i != winningProposalId) {
                    isTie = true;
                }
            }
        }

        return (winningProposalId, winningVoteCount, isTie && winnersCount > 1);
    }

    /// @notice Get details of the winning proposal
    function getWinningProposalDetails() external view returns (
        string memory description,
        uint256 voteCount,
        bool isTie,
        bool isClosed
    ) {
        (uint256 winningId, uint256 count, bool tie) = getWinningProposal();
        bool closed = proposals.length > 0 ? proposals[winningId].endTime < block.timestamp : false;
        return (proposals[winningId].description, count, tie, closed);
    }

    function getTiedProposals() external view returns (
    uint256[] memory tiedProposalIds,
    uint256 winningVoteCount
) {
    (uint256 _winningId, uint256 _winningVoteCount, bool _isTie) = getWinningProposal();
    winningVoteCount = _winningVoteCount;
    
    if (!_isTie) {
        return (new uint256[](0), winningVoteCount);
    }

    // Count how many proposals are tied
    uint256 tieCount = 0;
    for (uint256 i = 0; i < proposals.length; i++) {
        if (proposals[i].voteCount == winningVoteCount && block.timestamp > proposals[i].endTime) {
            tieCount++;
        }
    }

    // Collect the tied proposal IDs
    tiedProposalIds = new uint256[](tieCount);
    uint256 index = 0;
    for (uint256 i = 0; i < proposals.length; i++) {
        if (proposals[i].voteCount == winningVoteCount && block.timestamp > proposals[i].endTime) {
            tiedProposalIds[index] = i;
            index++;
        }
    }

    return (tiedProposalIds, winningVoteCount);
}
    /// @notice Get voting power for a token account
    function getVotingPower(bytes32 tokenAccount) external view returns (uint64) {
        return _getVotingPower(tokenAccount);
    }

    /// @notice Check if an account has voted on a proposal
    function hasVoted(bytes32 voterAccount, uint256 proposalId) external view returns (bool) {
        if (proposalId >= proposals.length) return false;
        return proposals[proposalId].voters[voterAccount];
    }

    /// @notice Get token metadata
    function getTokenMetadata() external view returns (
        string memory name,
        string memory symbol,
        string memory uri,
        uint8 decimals
    ) {
        LibMetaplexData.TokenMetadata memory metadata = LibMetaplexData.getDeserializedMetadata(votingTokenMint);
        return (
            metadata.tokenName,
            metadata.tokenSymbol,
            metadata.uri,
            LibSPLTokenData.getSPLTokenDecimals(votingTokenMint)
        );
    }

    // ========== INTERNAL FUNCTIONS ========== //

    function _getVotingPower(bytes32 tokenAccount) internal view returns (uint64) {
        if (!tokenInitialized || 
            LibSPLTokenData.getSPLTokenAccountMint(tokenAccount) != votingTokenMint) {
            return 0;
        }
        return LibSPLTokenData.getSPLTokenAccountBalance(tokenAccount);
    }

    function _initializeTokenAccount(bytes32 tokenAccount, bytes32 mintAccount) internal {
        (bytes32[] memory accounts, bool[] memory isSigner, bool[] memory isWritable, bytes memory data) = 
            LibSPLTokenProgram.formatInitializeAccount2Instruction(
                tokenAccount,
                mintAccount,
                CALL_SOLANA.getNeonAddress(address(this))
            );
        
        bytes memory instruction = CallSolanaHelperLib.prepareSolanaInstruction(
            Constants.getTokenProgramId(),
            accounts,
            isSigner,
            isWritable,
            data
        );
        
        CALL_SOLANA.execute(0, instruction);
    }
}