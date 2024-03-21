import type { blog_data } from "./types";
import { get_token_and_task_data, send_answer } from "../modules/tasks"
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate } from "langchain/prompts";

const chat = new ChatOpenAI();

const systemTemplate = `
Jako specjalistą od pizzy i blogger piszesz wpis o pizzy. Podany temat jest fragmentem tego wpisu, 
zatem to co napiszesz jest fragmentem większej całości która składa się z tematów:

{topics}
`;

const humanTemplate = `Napisz kilka zdań na temat: {this_topic}`;

const chat_prompt = ChatPromptTemplate.fromPromptMessages([
    ["system", systemTemplate],
    ["human", humanTemplate],
]);

async function main() {
    const data:blog_data = await get_token_and_task_data("blogger")

    const topics = data.blog.join("; ");

    const promises = data.blog.map(async this_topic => {
        const formatted_chat_prompt = await chat_prompt.formatMessages({
            topics,
            this_topic,
        });

        const { content } = await chat.call(formatted_chat_prompt);

        return content;
    });

    const results = await Promise.all(promises);
    console.log("results: " + JSON.stringify(results));

    const isOK = await send_answer(results)
}

main();