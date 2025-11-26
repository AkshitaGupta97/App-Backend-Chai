
/*
- This creates a custom error class called ApiError that inherits from JavaScript’s built‑in Error class.
→ It allows you to throw errors with extra metadata useful for APIs.
 */

class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        errors = [],
        stack= ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors;

        if(stack){
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
export {ApiError}

/*
The constructor accepts four arguments:
- statusCode: HTTP status code (e.g., 404, 500).
- message: error message (defaults to "Something went wrong").
- errors: an array of detailed error messages (defaults to empty array).
- stack: optional stack trace string.
*/

/*
- super(message)
Calls the parent Error constructor so the error behaves like a normal JavaScript error with a message.

- Custom properties added:
- this.statusCode = statusCode → stores the HTTP status code.
- this.data = null → placeholder for any extra data (currently always null).
- this.message = message → sets the error message.
- this.success = false → indicates the API call failed.
- 

- Stack trace handling:
- If a stack string is provided, it sets this.stack = stack.
- Otherwise, it uses Error.captureStackTrace(this, this.constructor) to generate a stack trace automatically.

*/