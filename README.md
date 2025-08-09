# PrepMate
A simple,minimalistic app that you can use to prepare for your JEE/NEET exams

## ScreenShots

![Onboarding](https://hc-cdn.hel1.your-objectstorage.com/s/v3/256faed33d22400e5190c335957545557e746e31_image.png)
![Overview](https://hc-cdn.hel1.your-objectstorage.com/s/v3/7d4fad181135af6508d851e6742e26acd877769a_image.png)
![Notes](https://hc-cdn.hel1.your-objectstorage.com/s/v3/06f0ed07197a8c91e74dcacb2b032828191d7bf2_image.png)

##  Features
- **Daily Goals**
   - Shows what stuff you have to learn for the day so u dont be a lazy dude(or gal)
- **Quizzes**
   - Its quizzes what more can you say
- **Notes**
   - Generates actual useful notes using AI
- **Ask AI**
   - You can get AI help for stuff u really struggle with
- **Everything is generated on the fly**
   - Yep all the notes,daily plans and quizzes are generated using AI so they are always customized for you

## Stuff i used to make this
- React Native
- Gluestack UI and nativewind
- React MMKV (for storing stuff)
- Cerebras (for the AI stuff)

## How to build

Make a new file ```app/utils/ai/apiKey.ts``` and include your Cerebras API key in it (```app/utils/ai/apiKey.example.ts```)
```bash
git clone https://github.com/AjayAntoIsDev/PrepMate/
cd PrepMate
npm i
npx run expo # Make sure you have a android emulator
```