use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("token_id already claimed")]
    Claimed {},

    #[error("Cannot set approval that is already expired")]
    Expired {},

    #[error("Approval not found for: {spender}")]
    ApprovalNotFound { spender: String },

    #[error("Minting is currently disabled")]
    MintingDisabled {},

    #[error("Maximum number of mints reached")]
    MaxMintsReached {},

    #[error("Incorrect payment amount")]
    IncorrectPayment {},

    #[error("Insufficient funds")]
    InsufficientFunds {},
}
