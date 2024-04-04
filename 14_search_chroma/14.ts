import {get_token_and_task_data, send_answer} from "../modules/tasks"
import { ChromaClient } from 'chromadb'

const client = new ChromaClient();
const embed_url = "http://localhost:5000/embed/";
const chroma_collection_name = "search_chroma";


class MyEmbeddingFunction {
    public async generate(texts: string[]): Promise<number[][]> {
        // for each of the texts, call the embed_url with the text and return promise with the result
        const promises = texts.map(async (text) => {
            const result = await fetch(embed_url, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phrase: text
                })
            });
            const result_json = await result.json();
            return result_json;
        })
        return Promise.all(promises);
    }
}


async function pull_and_insert_records(collection) {
    const url = "https://unknow.news/archiwum.json";
    const response = await fetch(url);
    const records = await response.json();

    console.log("found: " + records.length + " records");

    console.log("Adding records to the database...")
    for (let i=0; i<Math.min(records.length, 300); i++) {

        const {title, url, info, date} = records[i];
        await collection.add({
            ids: [url],
            metadatas: [{title, url, info, date}],
            documents: [`${title} ${info}`],
        })
        console.log(`record ${i} of ${records.length} `)
    }
}


async function delete_collection() {
    await client.deleteCollection({name: chroma_collection_name})
}


async function create_and_return_collection() {
    // check if collection exists
    let collection;
    try {
        collection = await client.getCollection({
            name: chroma_collection_name,
            embeddingFunction: new MyEmbeddingFunction(),
        })
    } catch (e) {
        console.log("collection does not exist")
        collection = await client.createCollection({
            name: chroma_collection_name,
            embeddingFunction: new MyEmbeddingFunction(),
        });
    }
    const cnt = await collection.count();
    console.log("collection count: " + cnt);

    return collection;
}


async function main() {
    const collection = await create_and_return_collection();

    await pull_and_insert_records(collection);

    const data = await get_token_and_task_data("search");

    const {question} = data;
    const embedding_function = new MyEmbeddingFunction();
    const question_embedding = await embedding_function.generate([question]);

    const result = await collection.query({
        queryEmbeddings: question_embedding,
        nResults: 1,
    })
    console.log(result);

    await send_answer(result.ids[0][0]);
}

main();

