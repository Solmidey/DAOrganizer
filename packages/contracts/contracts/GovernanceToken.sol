// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20Votes, Ownable {
    constructor() ERC20Votes("GovernanceToken", "GOV") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function _maxSupply() internal pure override returns (uint224) {
        return type(uint224).max;
    }
}
