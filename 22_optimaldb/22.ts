import {get_token_and_task_data, send_answer} from "../modules/tasks"
import OpenAI from "openai";

const fs = require('fs');
const file_name = "optimized-gpt-4-turbo-2024-04-09.json";

const system_prompt = `Goal: optimize the string size. 
Return the string provided by the user as concise as possible. Remove filler words, but keep the meaning. 
Focus on preserving all the information, but make it as short as possible. 
Example source:
Podczas przerw na uczelni gra w szachy, doskonaląc umiejętność strategicznego myślenia. Udziela też korepetycji z prawa konstytucyjnego, budując swoją markę jako prawnik. Tatuaż na jej plecach przedstawia symbole róży i gołębia, to dla niej bardzo osobiste.
Example result: 
Na uczelni gra w szachy. Udziela korepetycji z prawa konstytucyjnego. Tatuaż na jej plecach przedstawia różę i gołębia.
`;

async function optimize_length(text:string) : string {
    const openai = new OpenAI();
    const messages = [
        { "role": "system", "content": system_prompt },
        { "role": "user", "content": text },
    ];

    console.log("Optimizing: \n" + text);

    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-2024-04-09",
        messages: messages
    });

    console.log("\nOptimized: \n" + response.choices[0].message.content + "\n\n");

    return response.choices[0].message.content;
}

async function main() {
    const data = await get_token_and_task_data("optimaldb")
    const database_json_url = data.database;
    const friends = await fetch(database_json_url).then(r => r.json());
    const optimized = {};
    const length_limit = 3000;
    let answer = "";

    // check if the file already exists
    if (fs.existsSync(file_name)) {
        const optimized_json = fs.readFileSync(file_name);
        const answer_json = JSON.parse(optimized_json);

        for (const friend in answer_json) {
            answer += `\n### ${friend} ###\n`;
            for (const info in answer_json[friend]) {
                answer += answer_json[friend][info];
            }
        }

        console.log(answer);
        send_answer(answer);
        return;
    } else {

        for (const friend in friends) {
            let source = "";

            optimized[friend] = [];
            for (const info in friends[friend]) {
                if (source.length < length_limit) {
                    source += friends[friend][info] + " ";
                } else {
                    const destination = await optimize_length(source);
                    optimized[friend].push(destination);
                    source = "";
                }
            }
            if (source.length > 0) {
                const destination = await optimize_length(source);
                optimized[friend].push(destination);
            }
        }

        // write to file for later use
        fs.writeFile(file_name, JSON.stringify(optimized), function(err) {
            if (err) {
                console.log(err);
            }
        });

        // prepare the answer string
        const answer_json = optimized;
        for (const friend in answer_json) {
            answer += `\n### ${friend} ###\n`;
            for (const info in answer_json[friend]) {
                answer += answer_json[friend][info];
            }
        }

        send_answer(answer);
    }
}

main();