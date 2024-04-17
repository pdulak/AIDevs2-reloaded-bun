import {get_token_and_task_data, send_answer} from "../modules/tasks"
import OpenAI from "openai";
const { getJson } = require("serpapi");

import express from "express";

const app = express();
const port = 3034;
const openai = new OpenAI();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/", async (req, res) => {
    console.log("question: ", req.body.question);

    const messages = [
        { "role": "system", "content": `
Rephrase user message to the form in which it can be used in the search engine. 
Make it the best search term for Google for given phrase.
Make it as short as possible, use keywords only` },
        { "role": "user", "content": req.body.question },
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages
    });

    const search_term = response.choices[0].message.content

    console.log("---\nSending to SERP: ", search_term);

    getJson({
        engine: "google",
        q: search_term,
        api_key: process.env.SERP_API_KEY
    }, (json) => {
        console.log(json["organic_results"][0].link);
        res.json({ "reply" : json["organic_results"][0].link });
    });

    //
});


async function main() {
    const data = await get_token_and_task_data("google")

    console.log("starting server");
    app.listen(port, () => {
        console.log(`Listening on port ${port}...`);
    });

    await send_answer("https://aidevs.dulare.com/");
}

main();