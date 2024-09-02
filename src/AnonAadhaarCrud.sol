// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "../interfaces/IAnonAadhaar.sol";
import "../interfaces/IAnonAadhaarCrud.sol";

contract AnonAadhaarCrud is IAnonAadhaarCrud {
    address public anonAadhaarVerifierAddr;

    struct User {
        address userAddress;
        uint nullifierSeed;
        uint[4] revealedData; // [ageAbove18, gender, state, pincode]
    }

    mapping(uint => User) public usersByNullifier;
    mapping(address => uint) public nullifierByAddress;

    event UserAdded(address indexed userAddress, uint indexed nullifier);

    constructor(address _verifierAddr) {
        anonAadhaarVerifierAddr = _verifierAddr;
    }

    function addressToUint256(address _addr) private pure returns (uint256) {
        return uint256(uint160(_addr));
    }

    function addUser(
        uint nullifierSeed,
        uint nullifier,
        uint timestamp,
        uint signal,
        uint[4] memory revealArray,
        uint[8] memory groth16Proof
    ) public {
        require(
            usersByNullifier[nullifier].userAddress == address(0),
            "AnonAadhaarIdentity: User already exists"
        );
        require(
            addressToUint256(msg.sender) == signal,
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

        usersByNullifier[nullifier] = User(msg.sender, nullifierSeed, revealArray);
        nullifierByAddress[msg.sender] = nullifier;
        emit UserAdded(msg.sender, nullifier);
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
}