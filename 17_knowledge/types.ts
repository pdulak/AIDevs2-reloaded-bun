export interface function_data {
    reason:string,
    message: {
        function_call: {
            arguments:any,
            name:string
        }
    }
}