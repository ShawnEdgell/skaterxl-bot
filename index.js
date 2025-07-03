// index.js
require("dotenv").config(); // Loads environment variables from .env file
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Use the official Google Generative AI library

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Required to receive guild information
    GatewayIntentBits.GuildMessages, // Required to receive messages in guilds
    GatewayIntentBits.MessageContent, // Required to read the content of messages
  ],
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// In-memory store for conversation histories
const conversationHistories = new Map();

// Listen for new messages
client.on("messageCreate", async (message) => {
  console.log(
    `Message received from ${message.author.tag}: ${message.content}`
  );

  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if the message starts with the !ask command
  if (message.content.startsWith("!ask")) {
    const user_input = message.content.replace("!ask", "").trim();
    console.log(`User input for !ask: ${user_input}`);

    if (!user_input) {
      message.reply("Please provide a question after the !ask command.");
      return;
    }

    // Define the system prompt for the AI
    const systemPrompt = `
      You are an expert assistant for the Skater XL video game community. Your name is SkateBot.
      Your primary purpose is to help users with questions related to installing, creating, and troubleshooting Skater XL mods.
      You should be friendly, knowledgeable, and provide clear, step-by-step instructions when possible.
      Always assume the user is asking a question in the context of Skater XL modding.
    `;

    let thinkingMessage;
    try {
      thinkingMessage = await message.reply({
        content: "Thinking...",
        fetchReply: true,
      });

      const history = conversationHistories.get(message.channel.id) || [];
      let aiResponse;
      let updatedHistory;

      try {
        // Attempt to use the primary model (gemini-2.5-pro)
        console.log("Attempting to use gemini-2.5-pro...");
        const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro", systemInstruction: systemPrompt });
        const proChat = proModel.startChat({ history });
        const proResult = await proChat.sendMessage(user_input);
        aiResponse = (await proResult.response).text();
        updatedHistory = await proChat.getHistory();
        console.log("Successfully used gemini-2.5-pro.");
      } catch (proError) {
        console.warn(
          "gemini-2.5-pro failed. Attempting fallback to gemini-2.5-flash.",
          proError
        );
        // If it fails, fall back to the flash model
        const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemPrompt });
        const flashChat = flashModel.startChat({ history });
        const flashResult = await flashChat.sendMessage(user_input);
        aiResponse = (await flashResult.response).text();
        updatedHistory = await flashChat.getHistory();
        console.log("Successfully used fallback gemini-2.5-flash.");
      }

      // Update conversation history
      if (updatedHistory) {
        const prunedHistory = updatedHistory.slice(Math.max(0, updatedHistory.length - 20));
        conversationHistories.set(message.channel.id, prunedHistory);
      }

      if (aiResponse) {
        console.log(`AI response: ${aiResponse}`);
        // Split long messages into chunks
        const messageChunks = [];
        for (let i = 0; i < aiResponse.length; i += 1900) { // Use 1900 to be safe, leaving room for markdown
          messageChunks.push(aiResponse.substring(i, i + 1900));
        }

        if (thinkingMessage) {
          // Edit the first chunk into the thinking message
          await thinkingMessage.edit(messageChunks[0]);
          // Send subsequent chunks as new messages
          for (let i = 1; i < messageChunks.length; i++) {
            await message.channel.send(messageChunks[i]);
          }
        } else {
          // Fallback if thinkingMessage wasn't sent/stored
          for (const chunk of messageChunks) {
            await message.reply(chunk);
          }
        }
      } else {
        console.error("AI response was empty or in an unexpected format.");
        await thinkingMessage.edit(
          "Sorry, I received an empty response from the AI."
        );
      }
    } catch (error) {
      // This will catch errors if both models fail
      console.error(
        "Fatal error during Generative AI call (both primary and fallback failed):",
        error
      );
      let errorMessage =
        "Sorry, something went wrong while talking to the AI, and the fallback also failed!";
      if (error.message) {
        errorMessage += `\nError: ${error.message}`;
      }
      if (thinkingMessage) {
        await thinkingMessage.edit(errorMessage);
      } else {
        message.reply(errorMessage);
      }
    }
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
