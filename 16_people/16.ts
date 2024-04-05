import {get_token_and_task_data, send_answer} from "../modules/tasks"
import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from 'uuid';
import {ChatOpenAI} from "langchain/chat_models/openai";
import {ChatPromptTemplate} from "langchain/prompts";

const db = new Database("db.sqlite", { create: true });


const chat = new ChatOpenAI();

const system_template_extraction = `Z podanego pytania: 
- wyciągnij "imię" i "nazwisko" osoby
- jeśli imię jest zdrobnieniem, zmień na forme podstawową
- podaj wynik w formie JSON i NIC WIĘCEJ

Przykład:

Q: Jaka jest ulubiona potrawa Lecha Wałęsy
A: {{ "imie": "Lech", "nazwisko": "Wałęsa" }}

Q: Gdzie mieszka Krysia Krawczyk?
A: {{ "imie": "Krystyna", "nazwisko": "Krawczyk" }}
`;

const human_template_extraction = `
{question}
`;

const chat_prompt_extraction = ChatPromptTemplate.fromPromptMessages([
    ["system", system_template_extraction],
    ["human", human_template_extraction],
]);


const system_template_info = `Odpowiedz na pytanie na podstawie posiadanej wiedzy i tylko na tej podstawie. W miarę możliwości jednym słowem. Twoja wiedza:

{knowledge}
`;

const human_template_info = `
{question}
`;

const chat_prompt_info = ChatPromptTemplate.fromPromptMessages([
    ["system", system_template_info],
    ["human", human_template_info],
]);


async function create_database_table_if_not_exists() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS people (
            id TEXT,
            imie TEXT,
            nazwisko TEXT,
            wiek TEXT,
            o_mnie TEXT,
            ulubiona_postac_z_kapitana_bomby TEXT,
            ulubiony_serial TEXT,
            ulubiony_film TEXT,
            ulubiony_kolor TEXT
        )
    `);
}


async function pull_and_insert_records() {
    const url = "https://zadania.aidevs.pl/data/people.json";
    const response = await fetch(url);
    const records = await response.json();

    console.log("found: " + records.length + " records");

    console.log("Adding records to the database...")
    for (let i=0; i<records.length; i++) {
        const {imie, nazwisko, wiek, o_mnie, ulubiona_postac_z_kapitana_bomby, ulubiony_serial, ulubiony_film, ulubiony_kolor} = records[i];
        const query = db.query(`
            SELECT id 
            FROM people 
            WHERE imie = $imie
            and nazwisko = $nazwisko
            and wiek = $wiek
            and o_mnie = $o_mnie
            and ulubiona_postac_z_kapitana_bomby = $ulubiona_postac_z_kapitana_bomby
            and ulubiony_serial = $ulubiony_serial
            and ulubiony_film = $ulubiony_film
            and ulubiony_kolor = $ulubiony_kolor
        `);
        const exists = await query.get({
            $imie: imie,
            $nazwisko: nazwisko,
            $wiek: wiek,
            $o_mnie: o_mnie,
            $ulubiona_postac_z_kapitana_bomby: ulubiona_postac_z_kapitana_bomby,
            $ulubiony_serial: ulubiony_serial,
            $ulubiony_film: ulubiony_film,
            $ulubiony_kolor: ulubiony_kolor
        });
        if (!exists) {
            const id = uuidv4();
            await db.run(`INSERT INTO people VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, imie, nazwisko, wiek, o_mnie, ulubiona_postac_z_kapitana_bomby, ulubiony_serial, ulubiony_film, ulubiony_kolor]);
        }
    }
}



async function main() {
    
    // await create_database_table_if_not_exists();
    
    // await pull_and_insert_records();

    const data = await get_token_and_task_data("people");
    const question = data.question;

    const formatted_chat_prompt = await chat_prompt_extraction.formatMessages({
        question
    });

    const {content} = await chat.call(formatted_chat_prompt);

    try {
        const content_json = JSON.parse(content);
        console.log(content_json);

        const query = db.query(`
            SELECT id, imie, nazwisko, wiek, o_mnie, ulubiony_kolor
            FROM people 
            WHERE imie = $imie
            and nazwisko = $nazwisko
        `);
        const filtered = await query.all({
            $imie: content_json.imie,
            $nazwisko: content_json.nazwisko
        });

        console.log(filtered);

        if (filtered.length > 0) {
            let knowledge = "";
            for (let i = 0; i<filtered.length; i++) {
                const {imie, nazwisko, wiek, o_mnie, ulubiony_kolor} = filtered[i];
                knowledge += `###
Imię: ${imie}, Nazwisko: ${nazwisko}, Wiek: ${wiek}, O mnie: ${o_mnie}, Ulubiony kolor: ${ulubiony_kolor}
###
`;
            }
            const formatted_chat_prompt = await chat_prompt_info.formatMessages({
                knowledge, question
            });

            const {content} = await chat.call(formatted_chat_prompt);
            console.log(content);

            await send_answer(content);
        } else {
            console.log("Person not found");
        }

    } catch (e) {
        console.log("content is not valid json");
    }
}

main();

