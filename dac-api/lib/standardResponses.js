const unsupportedMethod = {
        response: {
            status: 405,
            data: {
                error: 'The endpoint does not support the provided HTTP method'
            }    
        }
    };

const malformedRequest = {
    response: {
        status: 400,
        data: {
            error: "The request body was not well-formed"
        }    
    }
};

const notFound = {
    response: {
        status: 404,
        data: {
            message: 'not found'
        }
    }
};

const notAuthoried = {
    response: {
        status: 403,
        data: {
            message: 'Not authorized to perform this action'
        }
    }
};

module.exports = {
    unsupportedMethod, malformedRequest, notFound, notAuthoried
}