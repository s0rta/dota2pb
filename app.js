const Discord = require('discord.js')
const Parser = require('rss-parser')

let parser = new Parser()

require('dotenv').config()

const client = new Discord.Client()

client.on('ready', () => {
    console.log('Bot is ready')
})

client.on('message', (msg) => {
    if (msg.content === '!patch') {
        parser.parseURL("https://steamdb.info/api/PatchnotesRSS/?appid=570")
            .then(data => {
                msg.reply(data.items[0].link)
            })
    }
})

function findRecentPatch() {
    return new Promise(resolve => {

    })
}

client.login(process.env.BOT_TOKEN)