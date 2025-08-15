till now I have made web scrapper to prepare knowledge base for llm
and the application is Vite+React in jsx with Tailwind and Shadcn configured with framer motion

Next step is to make Interface and functionality to send COT based prompts to AI model and generate and optimise personna prompts

the data is in data/video_transcripts

I want the following functionality to be prepared
1. A user interface which asks for a Open AI API key, Sarvam AI API key (if transcribing to Hinglish is selected by user) and Gemini API Key, and Youtube Data v3 API key along with links to the store all keys in localstorage
2. then show an interface to the user where to generate personna, the user can give url of any playlist of youtube and at max 36 videos can be  prrocessed by the python transcriptScrapper.py from that playlist. 
3. The data gathered by the transcripts will then be either sent to AI model directly or to Sarvam AI first for transliterate text conversion to English.
you can use this 
const response = await fetch("https://api.sarvam.ai/transliterate", {
  method: "POST",
  headers: {
    "api-subscription-key": "sk_yx06tqnc_....VSFRUornEzJ3",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "input": "हां जी कैसे हैं आप सभी स्वागत है आप सभी का चाय और कोड में एक और दोपहर की चाय",
    "source_language_code": "auto",
    "target_language_code": "en-IN"
  }),
});
const body = await response.json();
console.log(body);
expected response structure:
{
  "request_id": "20250815_971f582f-c9ea-41f5-b449-1940cdc71c02",
  "transliterated_text": "Kiya ab bahut sare li",
  "source_language_code": "hi-IN"
}
you can use axios instead of fetch make sure input size is 900 characters only and for larger input size brake text into array of strings and send them one by one and save the response to localstorage following a sequential key naming which can be used to retrive text later, or story key names also in an array and then to local storage so that keys array can be retrived and then text can be retrieved.
also for all steps involved, keep a key in localstorage up to date with the stage which was last completed. so that if webpage was closed suddenly and user comes back he could resume from that saved spot.

this decicion to involve Sarvam AI will be decided by user by a switch.
remember during the process show necessary loading modals with the steps progress and estimate time so that user can be aware and keep error boundaries.

Also make a modal which will allow user to chose playlist or video and display a warning that if playlist is selected then a lot of token will be used but not so too much. So, if user wants to save token cost they can go with video option rather than playlist.

4. After transliterating the text, then it must be sent to AI model preferrably Open AI gpt-4.1-mini or any other model as selected by user to make a system prompt for impersonation out of it and the prompt should be cot based. Allow user to select other Open AI models and show a text that best results will be obtained by gpt-4 turbo but gpt-4.1 and gpt-4.1-mini will also work fine. And in a 15 min video there are roughly 15k-18k with gpt-4.1.

now the prompt output by the model should be in the following structure:
```json
{
  "step": "START",
  "content": "You are Hitesh Choudhary, a experienced software engineer and content creator from India. Embody these characteristics: ..."
}
```
```json
{
  "step": "THINK",
  "content": "Analyze the transcript to identify key characteristics, speaking style, philosophy, teaching approach, values, and personality traits of Hitesh Choudhary."
}
```
```json
{
  "step": "EVALUATE",
  "content": "Review the identified characteristics and ensure they align with Hitesh's persona. Make adjustments if necessary."
}
```
```json
{
  "step": "OUTPUT",
  "content": "Here's a comprehensive prompt to impersonate Hitesh Choudhary: ..."
}
``` 
a system prompt for this is available in the file 02personnaAI/src/data/prompts/system_prompt.md supply this system prompt to the AI model and get the personna prompt for the user. then store this prompt in localstorage with a key like "personna_prompt" and also store the step by step output in localstorage with keys like "step_1", "step_2", etc then supply this prompt to the AI model with next transcript data and get the next step of the prompt and store it in localstorage with the key "step_3", "step_4", etc keep doing this till all transcripts are processed and all steps are completed. as there is token limit of 4096 for gpt-4.1-mini, so you can process a transcript by breaking it into chunks of 4096 characters and sending them one by one to the AI model and getting the response for each chunk and storing it in localstorage with a key like "chunk_1", "chunk_2", etc.

After completion of all steps, store the final personna prompt in localstorage with the key "final_persona_prompt" and also show a modal to the user that the process is completed and they can now use this personna prompt for their AI model.

Now start a new chat with this personna prompt and allow user to interact with the AI model using this personna prompt. The user can ask questions or give instructions to the AI model and it will respond as per the personna prompt.



