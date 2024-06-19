import CustomError from "./customError";

/**
 * Custom error class for unauthorized errors.
 * Extends the `CustomError` class.
 */
class UnauthorizedError extends CustomError {
  /**
   * Creates a new `UnauthorizedError` instance.
   * @param message The error message.
   * @param [additionalMessage] Additional message to add to the error
   */
  constructor(message: string, additionalMessage?: string) {
    super(message, 401, additionalMessage);
  }
}

/**
 * Exports the `UnauthorizedError` class.
 */
export default UnauthorizedError;
