//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract DAO {
    event Received(address, uint256);
    event VotingWithElectionID(uint256);
    event Withdrawal(address, uint256, bytes);

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
            electionsMapping[_electionID].isElectionInited,
            "election is not inited"
        );
        _;
    }

    modifier isPrizeWithdrawable(uint256 _electionID) {
        require(
            addressesToElectionIDs[msg.sender] != 0,
            "address is not a participant"
        );
        require(
            electionsMapping[_electionID].winner.winnerAddress == msg.sender,
            "address is not the winner"
        );
        require(
            !electionsMapping[_electionID].isPrizeWithdrawn,
            "prize has been withdrawn already"
        );
        if (electionsMapping[_electionID].deadline < block.timestamp) {
            electionsMapping[_electionID].isEnded = true;
        }
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
            !electionsMapping[_electionID]
                .addressToParticipant[msg.sender]
                .isVoted,
            "address has voted already"
        );
        require(10000000000000000 == msg.value, "amount is not 0.01 eth");
        _;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    address private owner;

    uint256 public feePercentage;
    uint256 public numberOfCurrentElections;
    uint256 public feeTreasury;

    mapping(uint256 => Election) public electionsMapping;
    mapping(address => uint256) public addressesToElectionIDs;

    constructor() {
        owner = msg.sender;
        feePercentage = 10;
        numberOfCurrentElections = 0;
    }

    // // emits election id which should be used in the other
    // // function calls to identify the election user is participating in.
    // // In order to test logic with deadline properly I let the owner
    // // to assign deadine. The right deadline is 256200;
    function addVoting(uint256 _deadline) public onlyOwner {
        numberOfCurrentElections++;

        electionsMapping[numberOfCurrentElections].isElectionInited = true;
        electionsMapping[numberOfCurrentElections].isPrizeWithdrawn = false;
        electionsMapping[numberOfCurrentElections].deadline =
            block.timestamp +
            _deadline;

        emit VotingWithElectionID(numberOfCurrentElections);
    }

    function participate(uint256 _electionID)
        public
        isElectionInited(_electionID)
    {
        require(
            addressesToElectionIDs[msg.sender] == 0,
            "addres is already a participated in voting"
        );
        Participant memory participant;
        participant.isParticipant = true;

        addressesToElectionIDs[msg.sender] = _electionID;
        electionsMapping[_electionID].addressToParticipant[
            msg.sender
        ] = participant;
    }

    function vote(address _candidate, uint256 _electionID)
        public
        payable
        isVoteAllowed(_electionID)
        isElectionInited(_electionID)
        isDeadlineReached(_electionID)
        isParticipatingInElections(_candidate)
    {
        electionsMapping[_electionID]
            .addressToParticipant[_candidate]
            .voteAmount += 1;
        electionsMapping[_electionID]
            .addressToParticipant[msg.sender]
            .isVoted = true;
        electionsMapping[_electionID].treasury += msg.value;

        if (
            electionsMapping[_electionID].winner.voteAmount <
            electionsMapping[_electionID]
                .addressToParticipant[_candidate]
                .voteAmount
        ) {
            electionsMapping[_electionID].winner.voteAmount = electionsMapping[
                _electionID
            ].addressToParticipant[_candidate].voteAmount;
            electionsMapping[_electionID].winner.winnerAddress = _candidate;
        }
        emit Received(msg.sender, msg.value);
    }

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

        emit Withdrawal(msg.sender, prize, data);

        electionsMapping[_electionID].treasury -= prize;
        electionsMapping[_electionID].isPrizeWithdrawn = true;

        feeTreasury = electionsMapping[_electionID].treasury;
        electionsMapping[_electionID].treasury = 0;
    }

    function calculateFee(uint256 _treasury) internal view returns (uint256) {
        return (feePercentage * _treasury) / 100;
    }

    function finishElection(uint256 _electionID) public onlyOwner {
        electionsMapping[_electionID].isEnded = true;
    }

    function withdrawFee() public payable onlyOwner {
        address payable _to = payable(msg.sender);
        (bool sent, ) = _to.call{value: feeTreasury}("");
        require(sent, "Failed to send Ether");
        feeTreasury = 0;
    }
}
