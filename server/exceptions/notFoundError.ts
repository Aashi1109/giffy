import CustomError from "./customError";

/**
 * Represents an error indicating that a requested resource was not found.
 * Extends the CustomError class.
 * @class NotFoundError
 * @extends CustomError
 */
class NotFoundError extends CustomError {
  /**
   * Creates a new instance of NotFoundError.
   * @constructor
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    /**
     * Passes the error message and HTTP status code (404 Not Found) to the parent constructor.
     * @param {string} message - The error message.
     * @param {number} statusCode - The HTTP status code (404 Not Found).
     */
    super(message, 404);
  }
}

/**
 * @exports NotFoundError
 */
export default NotFoundError;
