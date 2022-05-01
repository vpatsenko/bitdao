import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import { DAO } from "../typechain";

describe("DAO", function () {

  let dao: DAO;
  let owner: SignerWithAddress;
  let add1: SignerWithAddress;
  let add2: SignerWithAddress;
  let add3: SignerWithAddress;
  let add4: SignerWithAddress;

  const provider = waffle.provider;

  beforeEach(async () => {
    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy();
    await dao.deployed();

    // the first signer is owner by default
    [owner, add1, add2, add3, add4] = await ethers.getSigners();
  });

  it("It should addVoting, check electionId and then vote with address which was not a participant", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add4.address };
    await expect(dao.connect(add4).vote(add1.address, "1", options))
      .to.revertedWith("voter is not a participant");
  });

  it("It should addVoting, check electionId and then vote for a candidate wich is not a participant", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add2.address };
    await expect(dao.connect(add2).vote(add4.address, "1", options))
      .to.revertedWith("candidate is not a participant");
  });

  it("It should addVoting, check electionId and then vote for a candidate normally", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", options))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");
  });

  it("It should addVoting, check electionId and then vote for a candidate normally and then vote for the second time a", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", options))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");

    await expect(dao.connect(add1).vote(add2.address, "1", options))
      .to.revertedWith("address has voted already");
  });

  it("It should addVoting, check electionId, vote for a candidate with wrong eth amount ", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.001"), from: add1.address };
    await expect(dao.connect(add1).vote(add2.address, "1", options))
      .to.revertedWith("amount is not 0.01 eth");
  });

  it("It should addVoting, check electionId, vote for with wrong electionID ", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "256200"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add2.address, "2", options))
      .to.revertedWith("election is not inited");
  });

  it("It should addVoting with small deadline, sleep, and be reverted due to the ended deadline", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "2"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    await sleep(3000);

    const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add2.address, "1", options))
      .to.revertedWith("election is finished");
  });

  it("It should addVoting, vote for participant add3 and let this acc3 withdraw prize, then let the owner withdraw fee", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "2"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const optionAddress1 = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", optionAddress1))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");

    const optionAddress2 = { value: ethers.utils.parseEther("0.01"), from: add2.address };
    await expect(dao.connect(add2).vote(add3.address, "1", optionAddress2))
      .to.emit(dao, 'Received')
      .withArgs(add2.address, "10000000000000000");

    const currentElections = await dao.electionsMapping(BigNumber.from(1))

    expect(currentElections[0]).to.equal(true);
    expect(currentElections[1]).to.equal(false);
    expect(currentElections[2]).to.equal(false);

    expect(currentElections.winner[1].toString()).to.equal("2");
    expect(currentElections.winner.winnerAddress.toString()).to.equal(add3.address);

    await sleep(3000);

    await expect(dao.connect(add3).withdrawPrize("1"))
      .to.emit(dao, 'Withdrawal')
      .withArgs(add3.address, "18000000000000000", "0x");

    const feeTreasury = await dao.feeTreasury();
    expect(feeTreasury.toString()).to.equal("2000000000000000");

    await expect(dao.connect(add3).withdrawPrize("1"))
    await expect(dao.connect(owner).withdrawFee())

  });

  it("It should addVoting, vote for participant add3 and let this acc3 withdraw prize for the first time and be reverted for the secondn time", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "2"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    const optionAddress1 = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", optionAddress1))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");

    const optionAddress2 = { value: ethers.utils.parseEther("0.01"), from: add2.address };
    await expect(dao.connect(add2).vote(add3.address, "1", optionAddress2))
      .to.emit(dao, 'Received')
      .withArgs(add2.address, "10000000000000000");

    const currentElections = await dao.electionsMapping(BigNumber.from(1))

    expect(currentElections[0]).to.equal(true);
    expect(currentElections[1]).to.equal(false);
    expect(currentElections[2]).to.equal(false);

    expect(currentElections.winner[1].toString()).to.equal("2");
    expect(currentElections.winner.winnerAddress.toString()).to.equal(add3.address);

    await sleep(3000);

    await expect(dao.connect(add3).withdrawPrize("1"))
      .to.emit(dao, 'Withdrawal')
      .withArgs(add3.address, "18000000000000000", "0x");

    await expect(dao.connect(add3).withdrawPrize("1"))
      .to.revertedWith("prize has been withdrawn already");
  });

  it("It should addVoting, and withdraw prize with being reveted because it is not a participant", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.addVoting(participants, "2"))
      .to.emit(dao, 'VotingWithElectionID')
      .withArgs("1");

    await expect(dao.connect(add4).withdrawPrize("1"))
      .to.revertedWith("address is not a participant");
  });

  it("It should addVoting and withdrawFee with account different from owner and be reverted", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await expect(dao.connect(add1).addVoting(participants, "256200"))
      .to.revertedWith("Ownable: caller is not the owner");

    await expect(dao.connect(add1).withdrawFee())
      .to.revertedWith("Ownable: caller is not the owner");
  })

  it("It should test vote with winner that is changing", async function () {
    let participants = [add1.address, add2.address, add3.address];

    await dao.addVoting(participants, "256200");

    const optionAddress1 = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", optionAddress1))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");

    expect(await (await dao.electionsMapping("1")).winner[0]).to.equal(add3.address);
    expect(await (await dao.electionsMapping("1")).winner[1].toString()).to.equal("1");

    const optionAddress2 = { value: ethers.utils.parseEther("0.01"), from: add2.address };
    await expect(dao.connect(add2).vote(add1.address, "1", optionAddress2))
      .to.emit(dao, 'Received')
      .withArgs(add2.address, "10000000000000000");

    const optionAddress3 = { value: ethers.utils.parseEther("0.01"), from: add3.address };
    await expect(dao.connect(add3).vote(add1.address, "1", optionAddress3))
      .to.emit(dao, 'Received')
      .withArgs(add3.address, "10000000000000000");

    expect(await (await dao.electionsMapping("1")).winner[0]).to.equal(add1.address);
    expect(await (await dao.electionsMapping("1")).winner[1].toString()).to.equal("2");
  })

  it("It should revert for each require from isPrizeWithdrawable modifier", async function () {

    let participants = [add1.address, add2.address, add3.address];
    await dao.addVoting(participants, "2");

    await expect(dao.connect(add2).withdrawPrize("1"))
      .to.revertedWith("address is not the winner")

    await expect(dao.connect(add4).withdrawPrize("1"))
      .to.revertedWith("address is not a participant'")

    await sleep(2500)

    await expect(dao.connect(add1).withdrawPrize("1"))
      .to.revertedWith("address is not the winner")
  });

  it("It should revert for each require from isVoteAllowed modifier", async function () {

    let participants = [add1.address, add2.address, add3.address];
    await dao.addVoting(participants, "2");

    let option = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add3.address, "1", option))
      .to.emit(dao, 'Received')
      .withArgs(add1.address, "10000000000000000");

    await expect(dao.connect(add1).vote(add3.address, "1", option))
      .to.revertedWith("address has voted already");

    option.value = ethers.utils.parseEther("0.001");
    option.from = add2.address;

    await expect(dao.connect(add2).vote(add3.address, "1", option))
      .to.revertedWith("amount is not 0.01 eth");

    option.value = ethers.utils.parseEther("1");
    await expect(dao.connect(add2).vote(add3.address, "1", option))
      .to.revertedWith("amount is not 0.01 eth");
  });


  it("It should revert for each require from isParticipatingInElections modifier", async function () {

    let participants = [add1.address, add2.address, add3.address];
    await dao.addVoting(participants, "2");

    let option = { value: ethers.utils.parseEther("0.01"), from: add4.address };
    await expect(dao.connect(add4).vote(add3.address, "1", option))
      .to.revertedWith("voter is not a participant");

    option = { value: ethers.utils.parseEther("0.01"), from: add1.address };
    await expect(dao.connect(add1).vote(add4.address, "1", option))
      .to.revertedWith("candidate is not a participant");
  });

  it("It should revert while withdrawing fee with account different from owner", async function () {
    let participants = [add1.address, add2.address, add3.address];
    await dao.addVoting(participants, "2");

    await expect(dao.connect(add1).withdrawFee())
      .to.revertedWith("Ownable: caller is not the owner");
  })

  it("It should be reverted when calling withdraw fee", async function () {
    let participants = [add1.address, add2.address, add3.address];
    await dao.addVoting(participants, "2");

    await expect(dao.connect(add1).withdrawFee())
      .to.revertedWith("Ownable: caller is not the owner");
  })


  it("It should end election", async function () {
    let participants = [add1.address, add2.address, add3.address];
    await dao.addVoting(participants, "256200");

    await expect(dao.connect(add1).finishElection("1"))
      .to.revertedWith("Ownable: caller is not the owner");
    expect(await (await dao.electionsMapping("1")).isEnded).to.equal(false);

    await expect(dao.finishElection("1"))
    expect(await (await dao.electionsMapping("1")).isEnded).to.equal(true);
  })
});


async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}