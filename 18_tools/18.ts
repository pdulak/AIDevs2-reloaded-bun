import type {function_data} from "./types.ts";
import {get_token_and_task_data, send_answer} from "../modules/tasks.ts";
import OpenAI from "openai";
import * as sys from "sys";

const function_definition = [
    {
        "name": "ToDo",
        "description": "add item to ToDo list",
        "parameters": {
            "type": "object",
            "properties": {
                "desc": {
                    "type": "string",
                    "description": "description of the task to be added using the same language as the user call"
                }
            }
        },
    },
    {
        "name": "Calendar",
        "description": "add item to Calendar",
        "parameters": {
            "type": "object",
            "properties": {
                "desc": {
                    "type": "string",
                    "description": "description of the task to be added using the same language as the user call"
                },
                "date": {
                    "type": "string",
                    "description": "date of the event in the YYYY-MM-DD format"
                },
            }
        },
    },
];

const system_prompt = `Current date is ${new Date().toISOString().slice(0, 10)}. 
            Classify all tasks as ToDo or Calendar. 
            Calendar should be used for all tasks when the date is provided as part of the question. 
            Even if the date is passed as "tomorrow", "next week", "pojutrze" etc.`


async function let_openAi_decide(question:string) : function_data {
    const openai = new OpenAI();
    const messages = [
        { "role": "system", "content": system_prompt },
        { "role": "user", "content": question },
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        functions: function_definition,
        function_call: "auto",
    });

    return {
        reason : response.choices[0].finish_reason,
        message : response.choices[0].message,
    }
}


async function main() {
    const data = await get_token_and_task_data("tools");
    const { reason, message } = await let_openAi_decide(data.question);

    if (reason === "function_call") {
        const response = JSON.parse(message.function_call.arguments);
        response.tool = message.function_call.name;
        console.log("main_answer: ", response);
        await send_answer(response);
    }

}

main();