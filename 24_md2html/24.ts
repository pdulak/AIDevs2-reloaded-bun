import { get_token_and_task_data, send_answer } from "../modules/tasks"
import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
    const data = await get_token_and_task_data("md2html")

    console.log("\n\n---\nquestion: ", data.input);

    const messages = [
        { "role": "system", "content": "md2html" },
        { "role": "user", "content": data.input },
    ];

    const response = await openai.chat.completions.create({
        model: "ft:gpt-3.5-turbo-0125:personal-pawel-dulak:20240418-04:9FG7301c",
        messages: messages
    });

    const result = response.choices[0].message.content;

    console.log("---\nResult: ", result);
    
    await send_answer(result);
}

main();