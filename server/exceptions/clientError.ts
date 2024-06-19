import CustomError from "./customError";

/**
 * Represents an error that occurs due to client-side input or behavior.
 * Extends the CustomError class.
 * @class ClientError
 * @extends CustomError
 */
class ClientError extends CustomError {
  /**
   * Creates a new instance of ClientError.
   * @constructor
   * @param {string} message - The error message.
   * @param additionalInfo - Any additional information about the error
   */
  constructor(message: string, additionalInfo?: string) {
    super(message, 400, additionalInfo);
  }
}

export default ClientError;
