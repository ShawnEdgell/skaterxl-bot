// index.js
require("dotenv").config(); // Loads environment variables from .env file
const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai"); // Use the official OpenAI library

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Using a newer, capable model
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant knowledgeable about Skater XL and its modding community. Provide clear and concise answers.",
          },
          { role: "user", content: user_input },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content?.trim();

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
      console.error("Error during OpenAI API call:", error);
      let errorMessage = "Sorry, something went wrong while talking to the AI!";
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.message
      ) {
        errorMessage += `\nError: ${error.response.data.error.message}`;
      } else if (error.message) {
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
