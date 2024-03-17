import { get_token_and_task_data, send_answer } from "../modules/tasks"

const helloTask = async () => {
    const data = await get_token_and_task_data("helloapi")
    await send_answer(data.cookie)
}

helloTask()