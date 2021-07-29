const Discord = require('discord.js');
const fetch = require('node-fetch');

require('dotenv').config();

const client = new Discord.Client();

client.on('ready', () => {
    console.log('Bot is ready');
})

client.on('message', (msg) => {
    if (msg.content === '!patch') {
        fetch("http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=570&count=100&format=json")
            .then(data => data.json())
            .then(data => {
                const newsArr = data.appnews.newsitems;
                const newestNews = newsArr.find(n => {
                    return n.feed_type === 1;
                })
                console.log(newestNews);
                return newestNews;
            })
            .then(data => msg.reply(data.url))
    }
    else if (msg.content === '!patch help') {
        msg.reply('Subscribed to #' + msg.channel.name + ' in ' + msg.channel.guild.name);
    }
    else if (msg.content === '!patch subscribe') {
        let subscribedChannel = msg.channel.id;
        client.channels.cache.get(subscribedChannel).send('Subscribed to #' + msg.channel.name + ' in ' + msg.channel.guild.name);
        let lastPatchId = "";
        setInterval(() => {
            if (subscribedChannel != "") {
                lastPatchId = checkForPatch(lastPatchId, subscribedChannel);
            }
        }, 5000)
    }
})

function checkForPatch(lastPatchId, subscribedChannel) {
    fetch("http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=570&count=100&format=json")
        .then(data => data.json())
        .then(data => {
            const newsArr = data.appnews.newsitems;
            const newestNews = newsArr.find(n => {
                return n.feed_type === 1;
            })
            return newestNews;
        })
        .then(data => {
            if (data.gid !== lastPatchId) {
                client.channels.cache.get(subscribedChannel).send(data.url);
                return data.gid;
            }
        })

}


client.login(process.env.BOT_TOKEN)