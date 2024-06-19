import CustomError from "./customError";

/**
 * Represents an error indicating that access to a resource is forbidden.
 * Extends the CustomError class.
 * @class ForbiddenError
 * @extends CustomError
 */
class ForbiddenError extends CustomError {
  /**
   * Creates a new instance of ForbiddenError.
   * @constructor
   * @param {string} message - The error message.
   */
  constructor(message) {
    super(message, 403); // Passes the error message and HTTP status code (403 Forbidden) to the parent constructor
  }
}

export default ForbiddenError;
