import { get_token_and_task_data, send_answer } from "../modules/tasks"
import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from "openai"

const db = new Database("db.sqlite", { create: true });
const qdrant_url = "http://127.0.0.1:6333/"
const qdrant_collection = "news_collection"
const openai = new OpenAI()

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

async function init_qdrant() {
    const url = `${qdrant_url}collections/${qdrant_collection}`;
    const headers = { "Content-Type": "application/json" };
    const data = { "vector_size": 1536, "distance": "Cosine" };

    const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data)
    }).catch((error) => {
        console.log(error);
    });
    const init_response = await response.text();
    console.log(init_response);
}

async function pull_and_insert_records() {
    const url = "https://unknow.news/archiwum_aidevs.json";
    const response = await fetch(url);
    const records = await response.json();

    console.log("found: " + records.length + " records");

    console.log("Adding records to the database...")
    for (let i = 0; i < records.length; i++) {
        const { info } = records[i];
        const query = db.query("SELECT id FROM archive WHERE info = $info;");
        const exists = await query.get({ $info: info });
        if (!exists) {
            const id = uuidv4();
            const { title, url, info, date } = records[i];
            await db.run("INSERT INTO archive VALUES (?, ?, ?, ?, ?)", [id, title, url, info, date]);
        }
    }
}

async function upsert_records() {
    console.log("performing embedding...")
    const query = db.query("SELECT * FROM archive;");
    const db_records = await query.all();
    for (let i = 0; i < db_records.length; i++) {
        console.log(`record ${i} of ${db_records.length} `)
        const { id, title, url, info, date } = db_records[i];

        const phrase = `${title}
${info}`;

        console.log(phrase)

        const embeddings = await openai.embeddings.create({
            "input": phrase,
            "model": "text-embedding-ada-002"
        });

        // save embeddings to qdrant
        const put_url = `${qdrant_url}collections/${qdrant_collection}/points?wait=true`;
        const headers = { "Content-Type": "application/json" };
        const data = {
            "points":[ {
                "id": id,
                "payload": { "phrase": phrase },
                "vector": embeddings.data[0].embedding
            } ]
        };
        // put and console.log response
        const response = await fetch(put_url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data)
        }).catch((error) => {
            console.log(error);
        });
        const put_response = await response.json();
        console.log(put_response);
        
    }

    return 0;
}

async function main() {
    await create_database_table_if_not_exists();
    await init_qdrant();

    // await pull_and_insert_records();
    await upsert_records();

    const data = await get_token_and_task_data("search");

    const search_url = `${qdrant_url}collections/${qdrant_collection}/points/search`;
    const embeddings = await openai.embeddings.create({
        "input": data.question,
        "model": "text-embedding-ada-002"
    });

    const response = await fetch(search_url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "params": {
                "hnsw_ef": 128,
                "exact": false
            },
            "vector": embeddings.data[0].embedding,
            "limit": 5,
            "with_payload": true
        })
    }).catch((error) => {
        console.log(error);
    });
    // pull json from response
    const search_response = await response.json();
    console.log(search_response);
    
    
    // pull the record from the database using id from the search_ressponse[0].id
    const query = db.query("SELECT * FROM archive WHERE id = $id;");
    const db_record = await query.get({ $id: search_response.result[0].id });
    console.log(db_record);

    await send_answer(db_record.url);

    db.close();
}

main();