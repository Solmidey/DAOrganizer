import { expect } from "chai";
import { ethers } from "hardhat";

describe("GovernorAlpha", function () {
  it("deploys governor and token", async () => {
    const [admin] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("GovernanceToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const Timelock = await ethers.getContractFactory("TimelockController");
    const timelock = await Timelock.deploy(2, [], [], admin.address);
    await timelock.waitForDeployment();

    const Governor = await ethers.getContractFactory("GovernorAlpha");
    const governor = await Governor.deploy(await token.getAddress(), await timelock.getAddress());
    await governor.waitForDeployment();

    expect(await governor.name()).to.equal("OnchainGovernanceToolkit");
  });
});
