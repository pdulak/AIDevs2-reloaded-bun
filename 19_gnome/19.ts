import {get_token_and_task_data, send_answer} from "../modules/tasks";
import OpenAI from "openai";

async function main() {
    const data = await get_token_and_task_data("gnome");

    const openai = new OpenAI();

    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Return the color of the Hat of the Gnome using POLISH language. If there is no hat or not gnome, return ERROR as answer. Return only one word" },
                    {
                        type: "image_url",
                        image_url: {
                            "url": data.url,
                        },
                    },
                ],
            },
        ],
    });
    const answer = response.choices[0].message.content;

    console.log(answer);

    await send_answer(answer);

}

main();