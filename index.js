const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

// 🔹 Logging Channel & Role ID
const LOG_CHANNEL_ID = "1343784175806971906";
const ROLE_ID = "1339172006683217974"; // Replace with your role ID
const WEBHOOK_URL = "https://discord.com/api/webhooks/1343830302681727067/zUmOBTF5DYATW8Zt9ZgZ_ZbIbS_mycPlDAyKpjy_aNbaR_YbZ7XPMEKC7bzFg0hniote"; // 🔔 Webhook for offline alerts

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  logMessage("🚀 Bot has started and is online!");
});

// 🔹 Function to send logs to channel & webhook
function logMessage(message) {
  const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) logChannel.send(`📢 **Log:** ${message}`);
  console.log(`[LOG] ${message}`);
}

// 🔔 Notify webhook when bot shuts down
async function notifyShutdown() {
  try {
    await axios.post(WEBHOOK_URL, {
      content: "⚠️ **Alert:** The bot has gone offline!",
    });
    console.log("🔔 Webhook alert sent!");
  } catch (error) {
    console.error("⚠️ Failed to send webhook alert:", error.message);
  }
}

client.on("voiceStateUpdate", async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member) return;

  const role = newState.guild.roles.cache.get(ROLE_ID);
  if (!role) return console.log("⚠️ Role not found!");

  try {
    if (!newState.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return console.log("❌ Bot lacks permission to manage roles!");
    }

    if (!oldState.channelId && newState.channelId) {
      if (!member.roles.cache.has(ROLE_ID)) {
        await member.roles.add(role);
        logMessage(`✅ Added role to **${member.user.tag}** for joining VC.`);
      }
    } else if (oldState.channelId && !newState.channelId) {
      if (member.roles.cache.has(ROLE_ID)) {
        await member.roles.remove(role);
        logMessage(`❌ Removed role from **${member.user.tag}** for leaving VC.`);
      }
    }
  } catch (error) {
    console.error("⚠️ Error updating role:", error);
    logMessage(`⚠️ Error updating role for **${member.user.tag}**: ${error.message}`);
  }
});

// 🌍 Web server for UptimeRobot & keep bot alive
const express = require("express");
const app = express();

// 🔹 Keep bot running
function keepAlive() {
  app.get("/", (req, res) => {
    res.send("Bot is online!");
  });

  app.listen(3000, () => {
    console.log("🌍 Web server running...");
  });
}

// Call keepAlive() to ensure the bot stays online
keepAlive();

// 🔔 Trigger webhook if bot disconnects
process.on("SIGTERM", async () => {
  await notifyShutdown();
  process.exit();
});

process.on("SIGINT", async () => {
  await notifyShutdown();
  process.exit();
});

client.login(process.env.TOKEN);
