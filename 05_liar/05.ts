import {get_token, get_task_data_using_question, send_answer, get_task_data_using_question} from "../modules/tasks"
import {liar_data} from "./types";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {ChatPromptTemplate} from "langchain/prompts";

const chat = new ChatOpenAI();

const systemTemplate = `
Compare Question with Answer and decide if the answer is for the asked question. Answer with "YES" or "NO" only and don't give any explanation. 

### 

Example:
Q: What is the capital of France? A: Paris
Assistant Answer: YES

Q: What is day? A: Mediterranean sea lies next to Italy.
Assistant Answer: NO

###

It is crucial to respond ony with one word: "YES" or "NO", no new lines, no explanations, ony the word itself.
`;

const humanTemplate = `
Q: {question}
A: {answer}
`;

const chat_prompt = ChatPromptTemplate.fromPromptMessages([
    ["system", systemTemplate],
    ["human", humanTemplate],
]);

async function main() {
    const question = "What is the capital of France?"
    const token = await get_token("liar")
    const data: liar_data = await get_task_data_using_question(token, question)

    const formatted_chat_prompt = await chat_prompt.formatMessages({
        question,
        answer: data.answer,
    });

    const {content} = await chat.call(formatted_chat_prompt);

    console.log("content: " + JSON.stringify(content));

    await send_answer(content);
}

main();