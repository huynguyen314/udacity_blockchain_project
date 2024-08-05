// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "hardhat/console.sol";

// Collateralized Loan Contract
contract CollateralizedLoan {
    // Define the structure of a loan
    struct Loan {
        address borrower;
        address lender;
        uint collateralAmount;
        uint loanAmount;
        uint interestRate;
        uint dueDate;
        bool isFunded;
        bool isRepaid;
    }

    // Create a mapping to manage the loans
    mapping(uint => Loan) public loans;
    uint public nextLoanId;

    // events for loan requested, funded, repaid, and collateral claimed
    // Event for loan requested
    event LoanRequested(uint loadId, address borrower, uint loanAmount, uint collateraAmount, uint interestRate, uint dueDate);
    // Event for loan funded
    event LoanFunded(uint loanId, address lender);
    // Event for loan repaid
    event LoanRepaid(uint loanId, address borrower);
    // Event for collateral claimed
    event CollateralClaim(uint loanId, address lender);
    
    // Custom Modifiers
    // Modifier to check if a loan exists
    modifier loanExists(uint _loanId) {
        require(loans[_loanId].borrower != address(0), "Loan does not exist.");
        _;
    }
    // Modifier to ensure a loan is not already funded
    modifier loanNotFunded(uint _loanId) {
        require(!loans[_loanId].isFunded, "Loan Founded");
        _;
    }

    // Get Loan infor
    function getLoan(uint _loanId) public view returns (Loan memory) {
        return loans[_loanId];
    }
    // Function to deposit collateral and request a loan
    function depositCollateralAndRequestLoan(uint _interestRate, uint _duration) external payable {
        // Check if the collateral is more than 0
        require(msg.value > 0, "Collateral must be greater than 0.");
        require(_interestRate > 0, "Interest rate must be greater than 0.");
        require(_duration > 0, "Duration must be greater than 0");
        // Calculate the loan amount based on the collateralized amount
        uint loanAmount = msg.value;
        // Increment nextLoanId and create a new loan in the loans mapping
        nextLoanId += 1;
        uint dueDate = block.timestamp + _duration;
        loans[nextLoanId] = Loan(msg.sender, address(0), msg.value, loanAmount, _interestRate, dueDate, false, false);
        // Hint: Emit an event for loan request
        emit LoanRequested(nextLoanId, msg.sender, loanAmount, msg.value, _interestRate, dueDate);
    }

    // Function to fund a loan
    function fundLoan(uint _loanId) external payable loanExists(_loanId) loanNotFunded(_loanId){
        require(msg.value == loans[_loanId].loanAmount, "Incorrect loan amount sent");

        loans[_loanId].lender = msg.sender; // Set the lender
        loans[_loanId].isFunded = true; // Check the loan as funded
        emit LoanFunded(_loanId, msg.sender);
    }

    // Function to repay a loan
    function repayLoan(uint _loanId) external payable {
        Loan storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "Only the borrower can repay the loan.");
        require(loan.isFunded, "Loan must be funded");
        require(!loan.isRepaid, "Loan already repaid");
        require(block.timestamp <= loan.dueDate, "Loan is overdue");

        uint256 totalRepayment = loan.loanAmount * (100 + loan.interestRate)/100;
        require(msg.value == totalRepayment, "Incorrect repayment amount.");

        loan.isRepaid = true;
        payable(loan.borrower).transfer(loan.collateralAmount); // return collateral to borrower
        emit LoanRepaid(_loanId, msg.sender);

    }
    // Function to claim collateral on default
    function claimCollateral(uint _loanId) external payable {
        Loan storage loan = loans[_loanId];
        require(loan.lender == msg.sender, "Only the lender can claim collateral.");
        require(loan.isFunded, "Loan must be funded.");
        require(!loan.isRepaid, "Loan has already been repaid");
        console.log(block.timestamp);
        console.log(loan.dueDate);
        require(block.timestamp > loan.dueDate, "Loan is not overdue yet.");
        
        loan.isRepaid = true; // Mark the loan as repaid since the lender claims collateral
        payable(loan.lender).transfer(loan.collateralAmount); // transfer collateral to lender

        emit CollateralClaim(_loanId, msg.sender);
    }
}