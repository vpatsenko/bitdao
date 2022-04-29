import { expect } from "chai";
import { ethers } from "hardhat";

describe("DAO", function () {
  it("Should return the new  once it's changed", async function () {

    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy();
    await dao.deployed();


    // expect(await greeter.greet()).to.equal("Hello, world!");

    console.log(await dao)
    console.log(await dao.isElectionInited())
    console.log(await dao.feePercentage())
    // expect(await dao.owner()).to.equal(await ethers.Wallet);


  });
});
