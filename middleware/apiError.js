class ErrorHandler extends Error{ 
    //make a constructor that take message and error status code 
    constructor(message, statuscode,
        error = [],
        stack = ''
     ){
super(message);

this.statuscode = statuscode,
this.data = null,
this.error = error
this.success = false

if(stack){
    this.stack.stack
}else{Error.captureStackTrace(this, this.constructor)
    }

     }

}
export default ErrorHandler;