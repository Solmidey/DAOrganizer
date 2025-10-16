import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);

  const Token = await ethers.getContractFactory("GovernanceToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Timelock = await ethers.getContractFactory("TimelockController");
  const minDelay = 2;
  const proposers: string[] = [];
  const executors: string[] = [];
  const timelock = await Timelock.deploy(minDelay, proposers, executors, deployer.address);
  await timelock.waitForDeployment();

  const Governor = await ethers.getContractFactory("GovernorAlpha");
  const governor = await Governor.deploy(await token.getAddress(), await timelock.getAddress());
  await governor.waitForDeployment();

  const output = {
    governanceToken: await token.getAddress(),
    timelock: await timelock.getAddress(),
    governor: await governor.getAddress()
  };

  const outDir = path.resolve(__dirname, "../../apps/web/contracts");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "deployment.json"), JSON.stringify(output, null, 2));

  console.log("Deployment complete", output);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
