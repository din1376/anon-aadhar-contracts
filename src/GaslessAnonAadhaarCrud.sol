// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "../interfaces/IAnonAadhaar.sol";
import "../interfaces/IGaslessAnonAadhaarCrud.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GaslessAnonAadhaarCrud is IGaslessAnonAadhaarCrud, ReentrancyGuard {
    using ECDSA for bytes32;

    address public anonAadhaarVerifierAddr;
    address public owner;
    mapping(address => bool) public authorizedRelayers;

    struct User {
        address userAddress;
        uint nullifierSeed;
        uint[4] revealedData; // [ageAbove18, gender, state, pincode]
    }

    mapping(uint => User) public usersByNullifier;
    mapping(address => uint) public nullifierByAddress;
    mapping(bytes32 => bool) public executedTransactions;

    uint[] public allNullifiers;

    constructor(address _verifierAddr) {
        anonAadhaarVerifierAddr = _verifierAddr;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender], "Only authorized relayers can call this function");
        _;
    }

    function addRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = true;
        emit RelayerAdded(relayer);
    }

    function removeRelayer(address relayer) external onlyOwner {
        authorizedRelayers[relayer] = false;
        emit RelayerRemoved(relayer);
    }

    function addUserGasless(
        address userAddress,
        uint nullifierSeed,
        uint nullifier,
        uint timestamp,
        uint signal,
        uint[4] memory revealArray,
        uint[8] memory groth16Proof,
        uint256 nonce,
        bytes memory signature
    ) external onlyAuthorizedRelayer nonReentrant {
        bytes32 txHash = keccak256(abi.encodePacked(
            userAddress, nullifierSeed, nullifier, timestamp, signal, revealArray, groth16Proof, nonce
        ));
        require(!executedTransactions[txHash], "Transaction already executed");
        
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", txHash));
        address signer = messageHash.recover(signature);
        require(signer == userAddress, "Invalid signature");

        require(
            usersByNullifier[nullifier].userAddress == address(0),
            "AnonAadhaarIdentity: User already exists"
        );
        require(
            addressToUint256(userAddress) == signal,
            "AnonAadhaarIdentity: Wrong user signal sent"
        );
        require(
            IAnonAadhaar(anonAadhaarVerifierAddr).verifyAnonAadhaarProof(
                nullifierSeed,
                nullifier,
                timestamp,
                signal,
                revealArray,
                groth16Proof
            ),
            "AnonAadhaarIdentity: Proof sent is not valid"
        );

        usersByNullifier[nullifier] = User(userAddress, nullifierSeed, revealArray);
        nullifierByAddress[userAddress] = nullifier;
        executedTransactions[txHash] = true;
        allNullifiers.push(nullifier);
        emit UserAdded(userAddress, nullifier);
    }

    function getUserByNullifier(uint nullifier) public view returns (
        address userAddress,
        uint nullifierSeed,
        uint[4] memory revealedData
    ) {
        User memory user = usersByNullifier[nullifier];
        require(user.userAddress != address(0), "AnonAadhaarIdentity: User does not exist");
        return (user.userAddress, user.nullifierSeed, user.revealedData);
    }

    function getUserByAddress(address userAddress) public view returns (
        uint nullifier,
        uint nullifierSeed,
        uint[4] memory revealedData
    ) {
        nullifier = nullifierByAddress[userAddress];
        require(nullifier != 0, "AnonAadhaarIdentity: User does not exist");
        User memory user = usersByNullifier[nullifier];
        return (nullifier, user.nullifierSeed, user.revealedData);
    }

    function getAllUsers() public view returns (
        address[] memory userAddresses,
        uint[] memory nullifiers,
        uint[] memory nullifierSeeds,
        uint[4][] memory revealedDataArray
    ) {
        uint userCount = allNullifiers.length;
        userAddresses = new address[](userCount);
        nullifiers = new uint[](userCount);
        nullifierSeeds = new uint[](userCount);
        revealedDataArray = new uint[4][](userCount);

        for (uint i = 0; i < userCount; i++) {
            uint nullifier = allNullifiers[i];
            User memory user = usersByNullifier[nullifier];
            userAddresses[i] = user.userAddress;
            nullifiers[i] = nullifier;
            nullifierSeeds[i] = user.nullifierSeed;
            revealedDataArray[i] = user.revealedData;
        }

        return (userAddresses, nullifiers, nullifierSeeds, revealedDataArray);
    }

    function addressToUint256(address _addr) private pure returns (uint256) {
        return uint256(uint160(_addr));
    }

    // Function to receive ETH
    receive() external payable {}

    // Function to withdraw ETH (only owner)
    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
    }
}