import { get_token_and_task_data, send_answer } from "../modules/tasks"
import { OpenAI } from "openai"

const openai = new OpenAI()

async function main() {
    const data = await get_token_and_task_data("moderation")

    const sentences_to_moderate = data.input;

    const moderation_result = await openai.moderations.create({
        "input" : sentences_to_moderate,
    });

    const response_array = moderation_result.results.map(element => element.flagged?1:0);
    console.log("Moderation result: " + JSON.stringify(response_array));

    const isOK = await send_answer(response_array)
}

main();