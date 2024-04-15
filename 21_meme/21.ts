import {get_token_and_task_data, send_answer} from "../modules/tasks";

async function main() {
    const data = await get_token_and_task_data("meme");

    const response = await fetch("https://get.renderform.io/api/v2/render", {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.RENDERFORM_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "template": process.env.RENDERFORM_TEMPLATE_ID,
            "data": {
                "title.text": data.text,
                "image.src": data.image,
            }
        })
    });

    const parsed_response = await response.json();
    console.log(parsed_response);

    await send_answer(parsed_response.href);

}

main();