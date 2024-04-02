import {get_token_and_task_data, send_answer} from "../modules/tasks"
import {ChatOpenAI} from "langchain/chat_models/openai";
import {ChatPromptTemplate} from "langchain/prompts";

const chat = new ChatOpenAI();

const systemTemplate = `
Message {message}

Article:
{article}
`;

const humanTemplate = `
Q: {question}
`;

const chat_prompt = ChatPromptTemplate.fromPromptMessages([
    ["system", systemTemplate],
    ["human", humanTemplate],
]);


const fetchPage = async (pageURL:string, noMoreThan = 5, initialTimeout = 5000) => {
    let tries = noMoreThan;
    let timeout = initialTimeout;
    let data = "";

    while (tries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        try {
            const response = await Promise.race([

                fetch(pageURL, {headers: {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"}}),

                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), timeout)
                ),
            ]);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            data = await response.text();
            break;
        } catch (error) {
            console.error(`Attempt failed: ${error.message}`);
            tries--;
            timeout += 5000;
        }
    }

    return data;
}


async function main() {
    const data = await get_token_and_task_data("scraper")

    const urlToPull = data.input;
    const question = data.question;
    const message = data.msg;

    const article = await fetchPage(urlToPull);
    console.log(article)

    const formatted_chat_prompt = await chat_prompt.formatMessages({
        message,
        article,
        question,
    });

    const {content} = await chat.call(formatted_chat_prompt);
    console.log("content: " + JSON.stringify(content));

    await send_answer(content);
}

main();