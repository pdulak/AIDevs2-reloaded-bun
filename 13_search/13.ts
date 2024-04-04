import {get_token_and_task_data, send_answer} from "../modules/tasks"
import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from 'uuid';

const db = new Database("db.sqlite", { create: true });
const upsert_url = "http://127.0.0.1:5000/upsert/";
const search_url = "http://127.0.0.1:5000/search/";

async function create_database_table_if_not_exists() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS archive (
            id TEXT,
            title TEXT,
            url TEXT,
            info TEXT,
            date TEXT
        )
    `);
}

async function pull_and_insert_records() {
    const url = "https://unknow.news/archiwum_aidevs.json";
    const response = await fetch(url);
    const records = await response.json();

    console.log("found: " + records.length + " records");

    console.log("Adding records to the database...")
    for (let i=0; i<records.length; i++) {
        const {info} = records[i];
        const query = db.query("SELECT id FROM archive WHERE info = $info;");
        const exists = await query.get({$info: info});
        if (!exists) {
            const id = uuidv4();
            const {title, url, info, date} = records[i];
            await db.run("INSERT INTO archive VALUES (?, ?, ?, ?, ?)", [id, title, url, info, date]);
        }
    }
}

async function upsert_records() {
    console.log("performing embedding...")
    const query = db.query("SELECT * FROM archive;");
    const db_records = await query.all();
    for (let i=0; i<db_records.length; i++) {
        console.log(`record ${i} of ${db_records.length} `)
        const {id, title, url, info, date} = db_records[i];

        const phrase = `${title}
${info}`;

        console.log(phrase)

        const upsert_result = await fetch(upsert_url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ID: id,
                phrase: phrase
            })
        }).catch((error) => {
            console.log(error);
        });

        // wait 100 ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return 0;
}

async function main() {
    await create_database_table_if_not_exists();

    // await pull_and_insert_records();

    // await upsert_records();

    const data = await get_token_and_task_data("search");

    // search in vector db
    const search_result = await fetch(search_url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            search_term: data.question
        })
    }).catch((error) => {
        console.log(error);
    });

    const search_response = await search_result.json();
    console.log(search_response[0]);

    // pull the record from the database using id from the search_ressponse[0].id
    const query = db.query("SELECT * FROM archive WHERE id = $id;");
    const db_record = await query.get({$id: search_response[0].id});
    console.log(db_record);

    await send_answer(db_record.url);

    db.close();
}

main();