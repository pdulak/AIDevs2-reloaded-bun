import {get_token_and_task_data, send_answer} from "../modules/tasks"
import {ChatOpenAI} from "langchain/chat_models/openai";
import {ChatPromptTemplate} from "langchain/prompts";
import {inprompt_data} from "./types";

const chat = new ChatOpenAI();

const question_about_name = `
Pull the name of the person from the text below. Answer with the JSON object with name only and don't give any explanation. Example: {{"name": "John"}}

### Text to analyze ###
{text_to_analyze}
`;

const name_chat_prompt = ChatPromptTemplate.fromPromptMessages([
    ["human", question_about_name],
]);

const question_about_context = `
Using CONTEXT answer tye QUESTION. Answer as short as possible and don't give any explanation. Example: "Paris"

### CONTEXT ###
{context}

### QUESTION ###
{question}

`;

const context_chat_prompt = ChatPromptTemplate.fromPromptMessages([
    ["human", question_about_context],
]);


async function main() {
    const data:inprompt_data = await get_token_and_task_data("inprompt")

    const name_question_prompt = await name_chat_prompt.formatMessages({
        text_to_analyze: data.question
    });

    let {content} = await chat.call(name_question_prompt);

    const the_name = JSON.parse(content).name;
    console.log("The name: ", the_name);

    // using Array functions, select only these elements of data.input that contain the_name
    // and join them with a space
    const context = data.input.filter((element) => element.includes(the_name)).join(" ");

    const context_question_prompt = await context_chat_prompt.formatMessages({
        context,
        question: data.question
    });

    ({content} = await chat.call(context_question_prompt));

    console.log("The answer: " + JSON.stringify(content));

    await send_answer(content);
}

main();