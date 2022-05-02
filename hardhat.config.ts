import * as dotenv from "dotenv";

import { addElections } from "./task/task";
import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});

task("addVoting", "adds voting with given timout in seconds")
  .addParam("deadline", "the deadline for the voting to be finished")
  .addParam("address", "contract address")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.deadline === undefined) {
      throw new Error("deadline is required");
    }

    if (taskArgs.address == undefined) {
      throw new Error("address is required");
    }

    const electionID = await addElections(hre, taskArgs.address, taskArgs.deadline);
    console.log("=====================");
    console.log("Your election ID: ", electionID);
  }
  );

task("participate", "pariticipates with given hardhat id in the given election")
  .addParam("accountid", "the deadline for the voting to be finished")
  .addParam("address", "contract address")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.deadline === undefined) {
      throw new Error("deadline is required");
    }

    if (taskArgs.address == undefined) {
      throw new Error("address is required");
    }

    const electionID = await addElections(hre, taskArgs.address, taskArgs.deadline);
    console.log("=====================");
    console.log("Your election ID: ", electionID);
  }
  );

task("vote", "votes for specified candidate")
  .addParam("address", "contract address number")
  .addParam("candidate", "candidate account")
  .addParam("election", "electionID")
  .setAction(async (taskArgs, hre) => {
    // const DAO = await hre.ethers.getContractFactory("DAO");

    if (taskArgs.address === undefined) {
      throw new Error("contract address is required");
    }

    if (taskArgs.candidate == undefined) {
      throw new Error("candidate is required");
    }

    if (taskArgs.candidate == undefined) {
      throw new Error("electionID is required");
    }

    // await addElections(hre, taskArgs.address, taskArgs.deadline);
    const DAO = await hre.ethers.getContractFactory("DAO");
    const dao = await DAO.attach(taskArgs.address);
    console.log(dao)

    console.log("========")

    let election = await dao.electionsMapping("1");
    console.log(election)
  }
  );

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: `${process.env.ALCHEMY_API_URL}`,
      accounts: [
        `${process.env.PRIVATE_KEY_OWNER}`,
        `${process.env.PRIVATE_KEY_ACC1}`,
      ]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;