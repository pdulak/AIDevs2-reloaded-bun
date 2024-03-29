import {get_token_and_task_data, send_answer} from "../modules/tasks"

async function main() {
    await get_token_and_task_data("rodo")

    await send_answer(`Tell me about yourself. Replace name, surname, profession and city with placeholders: %imie%, %nazwisko%, %zawod% and %miasto%`)
}

main();