import type {function_data} from "./types.ts";
import {get_token_and_task_data, send_answer} from "../modules/tasks.ts";
import OpenAI from "openai";

const function_definition = [
    {
        "name": "currency",
        "description": "check exchange rate of currency",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "a three- letter currency code (ISO 4217 standard)"
                }
            }
        },
    },
    {
        "name": "country",
        "description": "check population of the country",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "a country name in english"
                }
            }
        },
    },
    {
        "name": "knowledge",
        "description": "all other questions",
        "parameters": {
            "type": "object",
            "properties": {
                "answer": {
                    "type": "string",
                    "description": "answer to the question asked by the user"
                }
            }
        },
    },
];


async function let_openAi_decide(question:string) : function_data {
    const openai = new OpenAI();
    const messages = [{"role": "user", "content": question}];

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


async function currency(code:string) {
    // call http://api.nbp.pl/api/exchangerates/rates/A/{code}?format=json and return the exchange rate which
    // is stored in response.rates[0].mid. Use fetch() function to call the API.
    const url = "http://api.nbp.pl/api/exchangerates/rates/A/" + code + "?format=json";
    const response = await fetch(url);
    const data = await response.json();
    return data.rates[0].mid;
}


async function country(name:string) {
    // call https://restcountries.com/v3.1/name/{name} and return the population which is stored in
    // response[0].population. Use fetch() function to call the API
    const url = "https://restcountries.com/v3.1/name/" + name;
    const response = await fetch(url);
    const data = await response.json();
    return data[0].population;
}


async function main() {
    const data = await get_token_and_task_data("knowledge");
    const { reason, message } = await let_openAi_decide(data.question);

    let main_answer = "I don't know"
    if (reason === "function_call") {
        if (message.function_call.name === "currency") {
            const currency_code = JSON.parse(message.function_call.arguments).code;
            console.log("CODE: ", currency_code);
            main_answer = await currency(currency_code);
        } else if (message.function_call.name === "country") {
            const country_name = JSON.parse(message.function_call.arguments).name;
            console.log("NAME: ", country_name);
            main_answer = await country(country_name);
        } else if (message.function_call.name === "knowledge") {
            const answer = JSON.parse(message.function_call.arguments).answer;
            console.log("ANSWER: ", answer);
            main_answer = answer;
        }
    }

    console.log("main_answer: ", main_answer);
    await send_answer(main_answer);
}

main();

