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

    let thinkingMessage;
    try {
      // Send a "Thinking..." message and store it to edit later
      thinkingMessage = await message.reply({
        content: "Thinking...",
        fetchReply: true,
      });

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(user_input);
      const response = await result.response;
      const aiResponse = response.text();

      if (aiResponse) {
        console.log(`AI response: ${aiResponse}`);
        // Edit the "Thinking..." message with the actual response
        if (thinkingMessage) {
          await thinkingMessage.edit(aiResponse);
        } else {
          message.reply(aiResponse); // Fallback if thinkingMessage wasn't sent/stored
        }
      } else {
        console.error("AI response was empty or in an unexpected format.");
        if (thinkingMessage) {
          await thinkingMessage.edit(
            "Sorry, I received an empty response from the AI."
          );
        } else {
          message.reply("Sorry, I received an empty response from the AI.");
        }
      }
    } catch (error) {
      console.error("Error during Google Generative AI API call:", error);
      let errorMessage = "Sorry, something went wrong while talking to the AI!";
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
