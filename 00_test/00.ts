import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
    const messages = [
        { "role": "system", "content": "You are a friendly assistant" },
        { "role": "user", "content": "tell me a joke" },
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
    });

    console.log(response.choices[0].message);

}

main();