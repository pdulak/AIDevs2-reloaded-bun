import { OpenAI } from "openai"

const openai = new OpenAI()

async function main() {
    const models = await openai.models.list();
    console.log(models);
}

main();