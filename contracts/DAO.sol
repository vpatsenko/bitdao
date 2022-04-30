//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAO is Ownable {
    event Received(address, uint256);

    struct Participant {
        bool isVoted;
        bool isParticipant;
        uint256 voteAmount;
    }

    struct Winner {
        address winnerAddress;
        uint256 voteAmount;
    }

    mapping(address => Participant) public addressToParticipant;

    modifier isParticipant(address v) {
        require(
            true == addressToParticipant[v].isParticipant,
            "address is not a participant"
        );
        require(
            true == addressToParticipant[msg.sender].isParticipant,
            "address is not a participant"
        );
        _;
    }

    modifier isDeadlineReached() {
        if (deadline < block.timestamp) {
            isElectionInited = false;
            deadline = 0;
            require(deadline > block.timestamp, "election is finished");
        }
        _;
    }

    modifier isElectionInitedMod() {
        require(isElectionInited == true, "election is not inited");
        _;
    }

    modifier prizeWithdrawnMod() {
        require(isPrizeWithdrawn == false, "prize is already withdrawn");
        require(deadline == 0, "deadline should be equal to zero");
        require(
            isElectionInited == false,
            "elections should be ended in order for the prize to be withdrawn"
        );
        require(
            msg.sender == winner.winnerAddress,
            "address is not the winner"
        );
        _;
    }

    bool public isElectionInited;
    bool public isPrizeWithdrawn;

    uint256 public deadline;
    uint256 public treasury;
    uint256 public feePercentage;

    Winner private winner;

    constructor() {
        isElectionInited = false;
        feePercentage = 20;
    }

    function initElections() public {
        require(true != isElectionInited, "election is inited");

        isElectionInited = true;
        deadline = block.timestamp + 259200;
    }

    function participate() public isElectionInitedMod isDeadlineReached {
        require(
            false == addressToParticipant[msg.sender].isParticipant,
            "address is a participant already"
        );
        addressToParticipant[msg.sender].isParticipant = true;
    }

    function vote(address _participant)
        public
        payable
        isElectionInitedMod
        isParticipant(_participant)
        isDeadlineReached
    {
        require(
            true != addressToParticipant[msg.sender].isVoted,
            "address has voted already"
        );
        require(1000000000000000000 == msg.value, "amount is not right");

        emit Received(msg.sender, msg.value);

        addressToParticipant[_participant].voteAmount += 1;
        addressToParticipant[msg.sender].isVoted = true;
        treasury += msg.value;

        // TODO: solve two winners problem
        if (winner.voteAmount < addressToParticipant[_participant].voteAmount) {
            winner.voteAmount = addressToParticipant[_participant].voteAmount;
            winner.winnerAddress = _participant;
        }
    }

    function withdrawPrize() public payable prizeWithdrawnMod {
        uint256 fee = calcFee();
        uint256 prize = treasury - fee;

        address payable _to = payable(msg.sender);
        (bool sent, bytes memory data) = _to.call{value: prize}("");
        require(sent, "Failed to send Ether");

        treasury -= prize;
        isPrizeWithdrawn = true;
    }

    function calcFee() internal view returns (uint256) {
        return (feePercentage * treasury) / 100;
    }

    function withdrawFee() public payable onlyOwner {
        require(isPrizeWithdrawn == false, "prize is not withdrawed");

        address payable _to = payable(msg.sender);
        (bool sent, bytes memory data) = _to.call{value: treasury}("");
        require(sent, "Failed to send Ether");
        treasury = 0;
    }
}
