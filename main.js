const Discord = require('discord.js')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const fs = require("fs");
const ms = require ("ms")

const adapter = new FileSync('db.json');
const storeadapter = new FileSync('store.json');
const db = low(adapter);
const storedb = low(storeadapter);


db.defaults({ missions: [], xp: [], inventory: []})
    .write()

var bot = new Discord.Client();
var prefix = '!'
var randnum = 0

var storynumber = db.get('missions').size().value();






bot.on('ready', () => {
    bot.user.setPresence({ game : { name : '!help', type : 0}});
    console.log("Bot en marche");
});

bot.login(process.env.TOKEN)

bot.on("guildMemberAdd", member => {
    let nrole = member.guild.roles.find("name", "Arrivant")
    member.guild.channels.find("name", "bienvenue").send(`<@${member.user.id}> vient de rejoindre **The Old Republic** ! Bienvenue !`)
    
    
    member.addRole(nrole)
})



bot.on('message', async message => {

    let msg =  message.content.toUpperCase(); 
    let sender = message.author;
    let cont = message.content.slice(prefix.length).split(" ");
    let argss  = cont.slice(1);
    
    

    var msgaut = message.author.id;

    if (message.author.bot)return;

    if(!db.get("inventory").find({user: msgaut}).value()){
        db.get("inventory").push({user: msgaut, items: "Vide. Oof."}).write();
    }


    if(!db.get("xp").find({user: msgaut}).value()){
        db.get("xp").push({user: msgaut, xp: 1}).write();
    }else{
        var userxpdb = db.get("xp").filter({user: msgaut}).find('xp').value();
        console.log(userxpdb);
        var userxp = Object.values(userxpdb)
        console.log(userxp)
        console.log(`XP: ${userxp[1]}`)

        db.get("xp").find({user: msgaut}).assign({user: msgaut, xp: userxp[1] += 1}).write();
    }

    if (message.content === prefix + "ping"){
        message.channel.send("Pong !")
        console.log('Ping ? Pong !');

    }

    if(message.content === prefix + "pong"){
        message.channel.send("Ping !")
        console.log('Pong ? Ping !')
    }

    if(!message.content.startsWith(prefix)) return;
    var args = message.content.substring(prefix.length).split(" ")

    switch (args[0].toLowerCase()){

        

        case "nmission":
        var value = message.content.substr(10);
        var author = message.author.toString();
        var number = db.get('missions').map('id').value();
        console.log(value);
        message.channel.send("Ajout de la mission à la base de données.")
        

        db.get('missions')
            .push({story_value: value, story_author: author})
            .write();

        break ;

        case "mission" : 

        story_random();
        console.log(randnum);

        var story = db.get(`missions[${randnum}].story_value`).toString().value();
        var author_story = db.get(`missions[${randnum}].story_author`).toString().value();
        console.log(story);

        message.channel.send(`${story} \n *(Ecrit par ${author_story})*`)

        break;

        case "boutique" :

        var sEmbed = new Discord.RichEmbed()
            .setTitle("Boutique de Webb")
            .setColor('#FE7F01')
            .setAuthor('Webb', 'https://cdn.discordapp.com/attachments/440895746343174157/441262607702425600/Webb.png')
            .setThumbnail('https://cdn.discordapp.com/attachments/440895746343174157/441263912994865152/Boutique.png')
            .setDescription("Achetez des grades et des objets avec vos points d'XP avec la commande !buyitem [ID de l'objet] s!")
            .addField("Grades :", "**VIP** [500 XP][ID: VIP] Montrez qui vous êtes ! ◊")
            .addField("Objets RP :", "**Slot-1** [400 XP] [ID : Slot-1] Emplacement pour un deuxième personnage. 🚶 \n**Slot-2** [600 XP] [ID : Slot-2] Jamais deux sans trois ! 🚶🚶 \n**Maison / Appartement** [200 XP] [ID : maison] Achetez une maison ou un appartement sur la planète de votre choix ! 🏠")
            
        

        message.channel.send({embed : sEmbed});
        


        break;

        case "buyitem":

        var itembuying = message.content.substr(9);
        if (!itembuying){
            itembuying = "Merci de spécifier.";
        }else{
            console.log(`StoreLog = Demande d'achat d'item ${itembuying}`)
            if(storedb.get("store_items").find({itemID: itembuying}).value()){
                console.log("Item trouvé.")
                var info = storedb.get("store_items").filter({itemID: itembuying}).find("name", "desc").value();
                var iteminfo = Object.values(info);
                console.log(iteminfo);  
                var buyembed = new Discord.RichEmbed()
                    .setTitle("Boutique - Votre récent achat !")
                    .setColor('#FE7F01')
                    .setFooter('Facture à conserver.')
                    .setAuthor('Webb', 'https://cdn.discordapp.com/attachments/440895746343174157/441262607702425600/Webb.png')
                    .setDescription("Merci pour votre achat !")
                    .addField("Informations", `ID : **${iteminfo[0]}**\nNom : **${iteminfo[1]}**\nDescription : **${iteminfo[2]}**\nPrix : **${iteminfo[3]}**`)

                message.channel.send({embed: buyembed});
                message.author.send({embed: buyembed});

                var useritem = db.get("inventory").filter({user: msgaut}).find("items").value();
                var itemsdb = Object.values(useritem);
                var userxpdb = db.get("xp").filter({user: msgaut}).find("xp").value();
                var userxp = Object.values(userxpdb);

                if (userxp[1] >= iteminfo[3]){
                    message.channel.send(`Votre **achat** (${iteminfo[1]}) a été effectué. Retrait de ${iteminfo[3]} XP.`)
                    if (!db.get("inventory").filter({user: msgaut}).find({items: ""}).value()){
                        console.log("Inventaire non vide.")
                        db.get("xp").filter({user: msgaut}).find("xp").assign({user: msgaut, xp: userxp[1] -= iteminfo[3]}).write();
                        db.get("inventory").filter({user: msgaut}).find("items").assign({user: msgaut, items: itemsdb[1] + " , " + iteminfo[1]}).write();
                    }else{
                        console.log("Inventaire vide.")
                        db.get("xp").filter({user: msgaut}).find("xp").assign({user: msgaut, xp: userxp[1] -= iteminfo[3]}).write();
                        db.get("inventory").filter({user: msgaut}).find("items").assign({user: msgaut, items: iteminfo[1]}).write();
                    }

                }else{
                    message.channel.send("Achat impossible. Fonds manquants.");
                    

                }
            }
        }


        break;

    }


    if (message.content === prefix + "help"){
        var helpe = new Discord.RichEmbed()
            .setColor('#FE7F01')
            .setAuthor('Loniix', 'https://cdn.discordapp.com/attachments/264714647876272129/424677317521047552/MIB_Rick.png')
            .setThumbnail('https://cdn.discordapp.com/attachments/439572673325039616/441229444766498817/Clean_Logo_TOR_transparent_sans_ombre.png')
            .addField("Commandes du bot", "Voici une liste des commandes de R9D3 accessible avec '!'.")
            .addField("Interactions", "!ping : Permet de tester la latence du bot. \n!mission : Vous donne une mission aléatoire. \n!stats : Vous permet de voir le nombre de messages envoyés.\n!boutique : Vous permet d'accéder à la boutique de Webb. \n!inventaire : Vous permet de vérifier votre inventaire." )
            .addField("Modération", "!clear : Vous permet de supprimer un certain nombre de messages. \n!say : Faites dire ce que vous voulez au bot. \n!warn : Permet d'avertir un joueur." )
            .setFooter("Plus à venir.")
        message.channel.send(helpe);
        console.log("Commande help demandée.")
    }

    if (message.content === "Ca va ?"){
        random();
        if (randnum == 1){
            message.channel.send("Parfait ! Et vous ?");
            console.log("Réponse numéro 1")
        }

        if (randnum == 2){
            message.channel.send("Plutôt bien. Je vous remercie.");
            console.log("Réponse numéro 2")
        }
    }

    if (message.content === prefix + "stats"){
        var xp = db.get("xp").filter({user: msgaut}).find('xp').value()
        var xpfinal = Object.values(xp);
        var xpe = new Discord.RichEmbed()
            .setColor('#FE7F01')
            .setThumbnail('https://cdn.discordapp.com/attachments/440660447381684227/441232514309423114/Orbe_dxp.png')
            .setTitle(`XP de ${message.author.username}`)
            .setDescription("Vos points d'XP à dépenser !")
            .addField("Points d'XP :", `${xpfinal[1]}`)
        message.channel.send({embed: xpe});
    }

    if (message.content === prefix + "inventaire"){
        var inv = db.get("inventory").filter({user: msgaut}).find('items').value()
        var invfinal = Object.values(inv);
        var inve = new Discord.RichEmbed()
            .setColor('#FE7F01')
            .setAuthor('Webb', 'https://cdn.discordapp.com/attachments/440895746343174157/441262607702425600/Webb.png')
            .setTitle(`Inventaire de ${message.author.username}`)
            .setDescription("Voici votre inventaire !")
            .addField("Objets possédés :", `${invfinal[1]}`)
        message.channel.send({embed: inve});
    }

    

    if (msg.startsWith(prefix + 'CLEAR')) {
        async function purge() {
            message.delete();

            if(!message.member.hasPermissions("MANAGE_MESSAGES")) {
                message.channel.send("Permissions insuffisantes. Oof.")
                return;
            }

            if (isNaN(argss[0])) {
                message.channel.send('Invalide. \n' + prefix + 'clear <nombre>');
                return;
            }

            const fetched = await message.channel.fetchMessages({limit: argss[0]});
            console.log(fetched.size + ' messages supprimés.');

            message.channel.bulkDelete(fetched)
                .catch(error => message.channel.send(`Erreur: ${error}`));

        }

        purge();
    }

    if (msg.startsWith(prefix + 'SAY')) {
        if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Permissions insuffisantes. Oof.")
        let botmessage = argss.join(" ");
        message.delete().catch();
        let botchannel = message.guild.channels.find("name", "discussion")
        botchannel.send(botmessage)
    }
    
    if (msg.startsWith(prefix + 'WARN')) {
        if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Permissions insuffisantes. Oof.")
        let wUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(argss[0])
        let warns = JSON.parse(fs.readFileSync("./warnings.json", "utf8"));
        if(!wUser) return message.channel.send("Introuvable.")
        if(wUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Impossible.");
        let reason = argss.join(" ").slice(22);

        if(!warns[wUser.id]) warns[wUser.id] = {
            warns: 0
        };

        warns[wUser.id].warns++;

        fs.writeFile("./warnings.json", JSON.stringify(warns), (err) => {
            if (err) console.log(err);
        });

        let warnEmbed = new Discord.RichEmbed()
        .setDescription("Avertissements")
        .setColor('#FE7F01')
        .addField("Membre averti", wUser.displayName)
        .addField("Averti dans", message.channel)
        .addField("Nombre d'avertissements", warns[wUser.id].warns)
        .addField("Raisons", reason)

        let warnchannel = message.guild.channels.find("name", "modération");
        if(!warnchannel) return message.channel.send("Salon introuvable.")

        warnchannel.send(warnEmbed);

        if(warns[wUser.id].warns == 2){
            let muterole = message.guild.roles.find("name", "Mute")
            if(!muterole) return message.channel.send("Vous devez créer un rôle pour ça.")

            let mutetime = "120s";
            await(wUser.addRole(muterole.id));
            message.channel.send(`@${wUser.user.username} a été temporairement muté.`)

            setTimeout(function() {
                wUser.removeRole(muterole.id)
                message.channel.send(`${wUser.displayName} reparle !`)
            }, ms(mutetime))

        }

        if(warns[wUser.id].warns == 3) {
            message.guild.member(wUser).kick(reason);
            message.channel.send(`@${wUser.displayName} a été exclu.`)
        }


    }

});

function random(min, max) {
    min = Math.ceil(0);
    max = Math.floor(3);
    randnum = Math.floor(Math.random() * (max - min +1) + min);
}

function story_random(min, max) {
    min = Math.ceil(0);
    max = Math.floor(storynumber);
    randnum = Math.floor(Math.random() * (max - min +1) + min);
}
