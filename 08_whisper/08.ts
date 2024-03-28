import { get_token_and_task_data, send_answer } from "../modules/tasks"
import { OpenAI } from "openai"

const openai = new OpenAI()

async function main() {
    const data = await get_token_and_task_data("whisper")

    // using regex extract link from the msg
    const link = data.msg.match(/https:\/\/\S+/)[0];
    console.log("Link: " + link);
    const blob = await fetch(link).then(r => r.blob());
    const file = new File([blob], "audio.mp3");

    const transcription = await openai.audio.transcriptions.create({
        "file": file,
        "model": "whisper-1"
    })

    console.log(transcription)

    await send_answer(transcription.text)
}

main();