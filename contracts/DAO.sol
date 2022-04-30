//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DAO is Ownable, ReentrancyGuard {
    event Received(address, uint256);
    event VotingWithElectionID(uint256);

    struct Participant {
        bool isVoted;
        bool isParticipant;
        uint256 voteAmount;
    }

    struct Winner {
        address winnerAddress;
        uint256 voteAmount;
    }

    struct Election {
        bool isElectionInited;
        bool isPrizeWithdrawn;
        bool isEnded;
        uint256 deadline;
        uint256 treasury;
        Winner winner;
        mapping(address => Participant) addressToParticipant;
    }

    modifier isDeadlineReached(uint256 _electionID) {
        if (electionsMapping[_electionID].deadline < block.timestamp) {
            electionsMapping[_electionID].isElectionInited = false;
            electionsMapping[_electionID].deadline = 0;
            revert("election is finished");
        }
        _;
    }

    modifier isElectionInited(uint256 _electionID) {
        require(
            electionsMapping[_electionID].isElectionInited == true,
            "election is not inited"
        );
        _;
    }

    modifier isPrizeWithdrawable(uint256 _electionID) {
        require(
            electionsMapping[_electionID].isEnded == true,
            "election is not ended"
        );
        require(
            electionsMapping[_electionID].winner.winnerAddress == msg.sender,
            "address is not the winner"
        );
        _;
    }

    modifier isParticipatingInElections(address _candidateAddress) {
        require(
            addressesToElectionIDs[msg.sender] != 0,
            "voter is not a participant"
        );
        require(
            addressesToElectionIDs[_candidateAddress] != 0,
            "candidate is not a participant"
        );
        _;
    }

    modifier isVoteAllowed(uint256 _electionID) {
        require(
            electionsMapping[_electionID]
                .addressToParticipant[msg.sender]
                .isVoted == false,
            "address has voted already"
        );
        require(10000000000000000 == msg.value, "amount is not 0.01 eth");
        _;
    }

    uint256 public feePercentage;
    uint256 public numberOfCurrentElections;
    uint256 public feeTreasury;

    mapping(uint256 => Election) public electionsMapping;
    mapping(address => uint256) public addressesToElectionIDs;

    constructor() ReentrancyGuard() {
        feePercentage = 10;
        numberOfCurrentElections = 0;
    }

    // returns election id which should be used in the other
    // function calls to identify the election user is participating in
    function addVoting(address[] memory participanAddressesList)
        public
        onlyOwner
    {
        numberOfCurrentElections++;
        electionsMapping[numberOfCurrentElections].isElectionInited = true;
        electionsMapping[numberOfCurrentElections].isPrizeWithdrawn = false;

        electionsMapping[numberOfCurrentElections].deadline =
            block.timestamp +
            256200;

        for (uint256 i = 0; i < participanAddressesList.length; i++) {
            Participant memory participant;
            participant.isParticipant = true;

            electionsMapping[numberOfCurrentElections].addressToParticipant[
                    participanAddressesList[i]
                ] = participant;

            addressesToElectionIDs[
                participanAddressesList[i]
            ] = numberOfCurrentElections;
        }

        emit VotingWithElectionID(numberOfCurrentElections);
    }

    function vote(address _participant, uint256 _electionID)
        public
        payable
        isParticipatingInElections(_participant)
        isVoteAllowed(_electionID)
        isElectionInited(_electionID)
        isDeadlineReached(_electionID)
    {
        electionsMapping[_electionID]
            .addressToParticipant[_participant]
            .voteAmount += 1;
        electionsMapping[_electionID]
            .addressToParticipant[msg.sender]
            .isVoted = true;
        electionsMapping[_electionID].treasury += msg.value;

        // TODO: solve two winners problem
        if (
            electionsMapping[_electionID].winner.voteAmount <
            electionsMapping[_electionID]
                .addressToParticipant[_participant]
                .voteAmount
        ) {
            electionsMapping[_electionID].winner.voteAmount = electionsMapping[
                _electionID
            ].addressToParticipant[_participant].voteAmount;
            electionsMapping[_electionID].winner.winnerAddress = _participant;
        }
        emit Received(msg.sender, msg.value);
    }

    // TODO: check isParticipatingInElections
    function withdrawPrize(uint256 _electionID)
        public
        payable
        isPrizeWithdrawable(_electionID)
    {
        uint256 fee = calculateFee(electionsMapping[_electionID].treasury);
        uint256 prize = electionsMapping[_electionID].treasury - fee;
        address payable _to = payable(msg.sender);

        (bool sent, bytes memory data) = _to.call{value: prize}("");
        require(sent, "Failed to send Ether");

        electionsMapping[_electionID].treasury -= prize;
        electionsMapping[_electionID].isPrizeWithdrawn = true;

        feeTreasury = electionsMapping[_electionID].treasury;
        electionsMapping[_electionID].treasury = 0;
    }

    function calculateFee(uint256 treasury) internal view returns (uint256) {
        return (feePercentage * treasury) / 100;
    }

    function withdrawFee() public payable onlyOwner {
        address payable _to = payable(msg.sender);
        (bool sent, bytes memory data) = _to.call{value: feeTreasury}("");
        require(sent, "Failed to send Ether");
        feeTreasury = 0;
    }
}
