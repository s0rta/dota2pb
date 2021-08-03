const Discord = require('discord.js');
const fetch = require('node-fetch');

require('dotenv').config();

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


const client = new Discord.Client();

client.on('ready', () => {
    console.log('Bot is ready');
});

setInterval(() => {
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
            db.collection('patch').doc('lastPatch').get()
                .then(doc => {
                    return doc.data().last_patch_id;
                }).then(lastPatchId => {
                    if (data.gid !== lastPatchId) {
                        // for (chanel in channels) {
                        //     channel.send("<@&" + botRole.id + "> " + data.url);
                        //     lastPatchId = data.gid;
                        // }
                        db.collection('channels').get()
                            .then(snapshot => {
                                snapshot.forEach((doc) => {
                                    console.log(doc.data());
                                    client.channels.cache.get(doc.data().channel_id)
                                        .send("<@&" + doc.data().role_id + "> " + data.url)
                                });
                            })
                            .catch(e => console.error(e));

                        db.collection('patch').doc('lastPatch').set({ 'last_patch_id': data.gid });
                    }
                })
                .catch(e => console.error(e));
        })
        .catch(e => console.error(e));
}, 5000); //120000 (2 mintues)

client.on('message', (msg) => {

    //post the most recent Dota 2 update
    if (msg.content === '!patch') {
        fetch("http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=570&count=100&format=json")
            .then(data => data.json())
            .then(data => {
                const newsArr = data.appnews.newsitems;
                const newestNews = newsArr.find(n => {
                    return n.feed_type === 1;
                })
                return newestNews;
            })
            .then(data => msg.reply(data.url))
            .catch(e => console.error(e));
    }


    //print bot command descriptions
    else if (msg.content === '!patch help') {
        msg.reply("\n!patch subscribe -- subscribes a channel to Dota 2 patch note updates\n!patch notify -- adds member to a role to recieve patch post alerts\n!patch help -- explains bot commands\n!patch -- gives info on most recent patch");
    }


    //subscribe a channel to recieve Dota 2 updates
    else if (msg.content === '!patch subscribe') {
        //check for existing role
        let botRole = msg.guild.roles.cache.find(role => {
            return role.name === 'Dota2PatchBotNotification';
        });

        //create new role if it doesn't exist
        if (botRole === undefined) {
            botRole = msg.guild.roles.create({
                data: {
                    name: 'Dota2PatchBotNotification',
                    color: 'RED',
                },
                reason: 'role to notify people of Dota 2 patch notes from the Dota 2 Patch Bot',
            });
        }
        db.collection('channels').doc(msg.guild.id)
            .set({
                'channel_id': msg.channel.id,
                'role_id': botRole.id
            });
        client.channels.cache.get(msg.channel.id).send('Subscribed to #' + msg.channel.name + ' in ' + msg.guild.name);
    }

    //subscribe a channel to recieve Dota 2 updates
    // else if (msg.content === '!patch subscribe') {
    //     let subscribedChannel = msg.channel.id;
    //     client.channels.cache.get(subscribedChannel).send('Subscribed to #' + msg.channel.name + ' in ' + msg.channel.guild.name);
    //     let lastPatchId = ""
    //     const patchPromise = new Promise((resolve, reject) => {
    //         setInterval(() => {
    //             if (subscribedChannel != "") {
    //                 fetch("http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=570&count=100&format=json")
    //                     .then(data => data.json())
    //                     .then(data => {
    //                         const newsArr = data.appnews.newsitems;
    //                         const newestNews = newsArr.find(n => {
    //                             return n.feed_type === 1;
    //                         })
    //                         return newestNews;
    //                     })
    //                     .then(data => {
    //                         if (data.gid !== lastPatchId) {
    //                             client.channels.cache.get(subscribedChannel).send("<@&" + botRole.id + "> " + data.url);
    //                             lastPatchId = data.gid;
    //                         }
    //                     })
    //                     .catch(e => console.error(e));
    //             }
    //         }, 5000) //120000 (2 mintues)
    //     })
    // }


    //get notified/alerted/@-ed when a new patch update is posted
    else if (msg.content === '!patch notify') {
        //if not yet subscribed, then error
        db.collection("channels").doc(msg.guild.name).get().then((doc) => {
            if (doc.exists) {
                msg.member.roles.add(botRole)
                msg.reply("you have subscribed to be notified of Dota2 patch notes and news");
            } else {
                // doc.data() will be undefined in this case
                msg.reply("you have subscribed to be notified of Dota2 patch notes and news");
            }
        })
            .catch(e => console.error(e));

        msg.member.roles.add(botRole)
        msg.reply("you have subscribed to be notified of Dota2 patch notes and news");
    }
})

client.login(process.env.BOT_TOKEN)