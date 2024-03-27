import { get_token_and_task_data, send_answer } from "../modules/tasks"
import { OpenAI } from "openai"

const openai = new OpenAI()

async function main() {
    const data = await get_token_and_task_data("embedding")

    const embedding_result = await openai.embeddings.create({
        "input" : "Hawaiian pizza",
        "model": "text-embedding-ada-002"
    });

    const isOK = await send_answer(embedding_result.data[0].embedding)
}

main();