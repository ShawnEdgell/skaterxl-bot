require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  console.log(`Message received: ${message.content}`); // Log received messages
  if (message.author.bot) return;

  if (message.content.startsWith('!ask')) {
    const user_input = message.content.replace('!ask', '').trim();
    console.log(`User input: ${user_input}`); // Log user input

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo', // Use the latest supported model
          messages: [{ role: 'user', content: user_input }],
          max_tokens: 300, // Default max tokens
          temperature: 0.7, // Default temperature
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`AI response: ${response.data.choices[0].message.content.trim()}`); // Log AI response
      message.reply(response.data.choices[0].message.content.trim());
    } catch (error) {
      console.error('Error during API call:', error.response ? error.response.data : error.message);
      message.reply('Sorry, something went wrong!');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
