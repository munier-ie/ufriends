/**
 * Centralized error handling utility for SubAndGain API errors
 * Maps error codes to user-friendly messages
 */

export interface ErrorDetails {
  title: string;
  description: string;
}

/**
 * Maps SubAndGain error codes to user-friendly error messages
 * @param errorCode - The error code from SubAndGain API
 * @returns An object with title and description for UI display
 */
export function getSubAndGainErrorDetails(errorCode: string): ErrorDetails {
  switch (errorCode) {
    // Authentication errors
    case "INVALID_USERNAME":
    case "ERR200":
      return {
        title: "Authentication Error",
        description: "Provider username is missing or invalid. Please contact support."
      };
    case "INVALID_CREDENTIALS":
    case "ERR201":
      return {
        title: "Authentication Error",
        description: "Invalid provider credentials. Please contact support."
      };
      
    // Balance errors
    case "INSUFFICIENT_BALANCE":
    case "ERR203":
      return {
        title: "Insufficient Balance",
        description: "Your account balance is insufficient to complete this transaction."
      };
      
    // Transaction errors
    case "TRANSACTION_FAILED":
    case "ERR206":
      return {
        title: "Transaction Failed",
        description: "Your transaction could not be processed. Please try again later."
      };
      
    // Input validation errors
    case "INVALID_PHONE":
    case "ERR202":
      return {
        title: "Invalid Phone Number",
        description: "The phone number provided is invalid. Please check and try again."
      };
    case "INVALID_NETWORK":
    case "ERR204":
      return {
        title: "Invalid Network",
        description: "The selected network provider is not supported or invalid."
      };
    case "INVALID_PLAN":
    case "ERR207":
      return {
        title: "Invalid Plan",
        description: "The selected data plan is invalid or unavailable."
      };
    case "INVALID_METER":
    case "ERR208":
      return {
        title: "Invalid Meter Number",
        description: "The meter number provided is invalid. Please check and try again."
      };
    case "INVALID_DISCO":
    case "ERR209":
      return {
        title: "Invalid Provider",
        description: "The selected electricity provider is invalid or not supported."
      };
    case "INVALID_AMOUNT":
    case "ERR210":
      return {
        title: "Invalid Amount",
        description: "The amount specified is invalid for this transaction."
      };
    case "INVALID_EDU_TYPE":
      return {
        title: "Invalid Education Type",
        description: "The selected education service type is invalid or not supported."
      };
      
    // Generic errors
    case "MISSING_CONFIG":
      return {
        title: "Configuration Error",
        description: "Provider configuration is missing. Please contact support."
      };
    case "BAD_INPUT":
      return {
        title: "Invalid Input",
        description: "Some required information is missing or invalid. Please check your inputs."
      };
    case "NETWORK_ERROR":
      return {
        title: "Network Error",
        description: "Unable to connect to the service provider. Please check your internet connection and try again."
      };
    case "NO_REFERENCE":
      return {
        title: "Transaction Reference Error",
        description: "Transaction completed but no reference was generated. Please contact support."
      };
    case "PROVIDER_ERROR":
    default:
      return {
        title: "Service Error",
        description: "An error occurred with the service provider. Please try again later or contact support."
      };
  }
}