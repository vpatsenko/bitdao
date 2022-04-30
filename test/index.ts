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

  // it("It should addVoting, check electionId and then vote with address which was not a participant", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "256200"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   const options = { value: ethers.utils.parseEther("0.01"), from: add4.address };
  //   await expect(dao.connect(add4).vote(add1.address, "1", options))
  //     .to.revertedWith("voter is not a participant");
  // });

  // it("It should addVoting, check electionId and then vote for a candidate wich is not a participant", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "256200"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   const options = { value: ethers.utils.parseEther("0.01"), from: add2.address };
  //   await expect(dao.connect(add2).vote(add4.address, "1", options))
  //     .to.revertedWith("candidate is not a participant");
  // });

  // it("It should addVoting, check electionId and then vote for a candidate normally", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "256200"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
  //   await expect(dao.connect(add1).vote(add3.address, "1", options))
  //     .to.emit(dao, 'Received')
  //     .withArgs(add1.address, "10000000000000000");
  // });

  // it("It should addVoting, check electionId and then vote for a candidate normally and then vote for the second time a", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "256200"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
  //   await expect(dao.connect(add1).vote(add3.address, "1", options))
  //     .to.emit(dao, 'Received')
  //     .withArgs(add1.address, "10000000000000000");

  //   await expect(dao.connect(add1).vote(add2.address, "1", options))
  //     .to.revertedWith("address has voted already");
  // });

  // it("It should addVoting, check electionId, vote for a candidate with wrong eth amount ", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "256200"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   const options = { value: ethers.utils.parseEther("0.001"), from: add1.address };
  //   await expect(dao.connect(add1).vote(add2.address, "1", options))
  //     .to.revertedWith("amount is not 0.01 eth");
  // });

  // it("It should addVoting, check electionId, vote for with wrong electionID ", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "256200"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
  //   await expect(dao.connect(add1).vote(add2.address, "2", options))
  //     .to.revertedWith("election is not inited");
  // });

  // it("It should addVoting with small deadline, sleep, and be reverted due to the ended deadline", async function () {
  //   let participants = [add1.address, add2.address, add3.address];

  //   await expect(dao.addVoting(participants, "2"))
  //     .to.emit(dao, 'VotingWithElectionID')
  //     .withArgs("1");

  //   await sleep(3000);

  //   const options = { value: ethers.utils.parseEther("0.01"), from: add1.address };
  //   await expect(dao.connect(add1).vote(add2.address, "1", options))
  //     .to.revertedWith("election is finished");
  // });

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


    console.log(await (await provider.getBalance(owner.address)).toString())
    await expect(dao.connect(owner).withdrawFee())
      .to.emit(dao, 'Withdrawal')
    // .withArgs(owner.address, "18000000000000000", "0x");

    console.log(await provider.getBalance(owner.address))
  });
});


async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}