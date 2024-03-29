import { get_token_and_task_data, send_answer } from "../modules/tasks"

async function main() {
    await get_token_and_task_data("functions")

    const function_definition = {
        "name": "addUser",
        "description": "add new user to the database",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "provide name of the user"
                },
                "surname" : {
                    "type": "string",
                    "description": "provide surname of the user"
                },
                "year" : {
                    "type": "number",
                    "description": "provide year of birth of the user"
                }
            }
        }
    }

    await send_answer(function_definition)
}

main();