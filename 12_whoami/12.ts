import {get_token_and_task_data, send_answer} from "../modules/tasks"
import {ChatOpenAI} from "langchain/chat_models/openai";
import {ChatPromptTemplate} from "langchain/prompts";

const chat = new ChatOpenAI();

const systemTemplate = `
You receive a piece of trivia to guess the person's identity.
You can guess the name if you are not sure, but always respond with the name only. 
If not enough information is provided, answer "not enough information".
`;

const humanTemplate = `
Information about the person:
{person_info}
`;

const chat_prompt = ChatPromptTemplate.fromPromptMessages([
    ["system", systemTemplate],
    ["human", humanTemplate],
]);


async function main() {
    let solved = false
    let tries = 0
    let person_info = ""
    const max_tries = 10

    while (!solved && tries < max_tries) {
        tries++;
        const data = await get_token_and_task_data("whoami")
        person_info += "- " + data.hint + "\n"

        console.log("person_info: \n" + person_info)

        const formatted_chat_prompt = await chat_prompt.formatMessages({
            person_info
        });

        const {content} = await chat.call(formatted_chat_prompt)
        console.log("answer: " + JSON.stringify(content) + "\n\n")

        const isOk = await send_answer(content)
        if (isOk.code === 0) {
            solved = true
        }
    }
}

main();