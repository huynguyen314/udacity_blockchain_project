// Importing necessary modules and functions from Hardhat and Chai for testing
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Describing a test suite for the CollateralizedLoan contract
describe("CollateralizedLoan", function () {
  // A fixture to deploy the contract before each test. This helps in reducing code repetition.
  async function deployCollateralizedLoanFixture() {
    // Deploying the CollateralizedLoan contract and returning necessary variables
    // TODO: Complete the deployment setup
    const [borrower, lender, addr1] = await ethers.getSigners();
    const CollateralizedLoan = await ethers.getContractFactory("CollateralizedLoan");
    const collateralizedLoan = await CollateralizedLoan.deploy();
    return {collateralizedLoan, borrower, lender, addr1};
  }

  // Test suite for the loan request functionality
  describe("Loan Request", function () {
    it("Should let a borrower deposit collateral and request a loan", async function () {
      // Loading the fixture
      // TODO: Set up test for depositing collateral and requesting a loan
      // HINT: Use .connect() to simulate actions from different accounts
      const { collateralizedLoan, borrower } = await loadFixture(deployCollateralizedLoanFixture);
      await collateralizedLoan
      .connect(borrower)
      .depositCollateralAndRequestLoan(ethers.parseEther("5"), ethers.parseEther("864000"), {value: ethers.parseEther("100")});
      const loan = await collateralizedLoan.getLoan(1);
      expect(loan.interestRate.toString()).to.equal(ethers.parseEther("5").toString());
      //expect(loan.isFunded).to.equal(false);
      //expect(loan.isPaid).to.equal(false);
    });
  });

  // Test suite for funding a loan
  describe("Funding a Loan", function () {
    it("Allows a lender to fund a requested loan", async function () {
      // Loading the fixture
      // TODO: Set up test for a lender funding a loan
      // HINT: You'll need to check for an event emission to verify the action
      const { collateralizedLoan, borrower, lender } = await loadFixture(deployCollateralizedLoanFixture);
      await collateralizedLoan
      .connect(borrower)
      .depositCollateralAndRequestLoan(ethers.parseEther("5"), ethers.parseEther("864000"), {value: ethers.parseEther("100")});
      await collateralizedLoan
      .connect(lender)
      .fundLoan(1, {value: ethers.parseEther("100")});
      const loan = await collateralizedLoan.getLoan(1);
      expect(loan.isFunded).to.equal(true);
    });
  });

  // Test suite for repaying a loan
  describe("Repaying a Loan", function () {
    it("Enables the borrower to repay the loan fully", async function () {
      // Loading the fixture
      // TODO: Set up test for a borrower repaying the loan
      // HINT: Consider including the calculation of the repayment amount
      const { collateralizedLoan, borrower, lender } = await loadFixture(deployCollateralizedLoanFixture);
      await collateralizedLoan
      .connect(borrower)
      .depositCollateralAndRequestLoan(5, 8640000, {value: ethers.parseEther("100")});
      await collateralizedLoan
      .connect(lender)
      .fundLoan(1, {value: ethers.parseEther("100")});
      await collateralizedLoan
      .connect(borrower)
      .repayLoan(1, {value: ethers.parseEther("105")});
      const loan = await collateralizedLoan.getLoan(1);
      expect(loan.isRepaid).to.equal(true);
    });
  });

  // Test suite for claiming collateral
  describe("Claiming Collateral", function () {
    it("Permits the lender to claim collateral if the loan isn't repaid on time", async function () {
      // Loading the fixture
      // TODO: Set up test for claiming collateral
      // HINT: Simulate the passage of time if necessary
      const { collateralizedLoan, borrower, lender } = await loadFixture(deployCollateralizedLoanFixture);
      await collateralizedLoan
      .connect(borrower)
      .depositCollateralAndRequestLoan(5, 864000, {value: ethers.parseEther("100")});
      await collateralizedLoan
      .connect(lender)
      .fundLoan(1, {value: ethers.parseEther("100")});
      await helpers.time.increase(3600*24*15); // Simulate the timestamp that passes the dueDate
      await collateralizedLoan
      .connect(lender)
      .claimCollateral(1);
      const loan = await collateralizedLoan.getLoan(1);
      expect(loan.isRepaid).to.equal(true);
    });
  });
});
