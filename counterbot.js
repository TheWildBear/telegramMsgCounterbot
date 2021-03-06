/**
 * http://usejsdoc.org/
 */

/*jshint esversion: 6 */

var config = require('./config');
const Telebot = require('telebot');
const bot = new Telebot({
	token: config.bottoken,
	limit: 1000});
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');
var log;
var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: config.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

let cooldown = [];

bot.start();

bot.on('text', (msg) => {
	var checkoptin = "SELECT COUNT(*) AS checkOptin FROM optintable where userid = " + hash(msg.from.id) + ";";
	db.getConnection(function(err, connection){
                connection.query(checkoptin, function(err, rows){
			if(rows[0].checkOptin==1){
				var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid) VALUES ?";
			        var values = [[msg.message_id, hash(msg.from.id), msg.chat.id]];
		        	db.query(sqlcmd, [values]);
			}
			connection.release();
		});
	});
});

bot.on('/optin', (msg) => {
	let sqlcmd = "INSERT INTO optintable (userid) VALUES ?";
	var values = [[hash(msg.from.id)]];
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, [values], function(err, result){
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You opted in for data collection!").then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimeoptin);
                        });
			connection.release();
		});
	});
});

bot.on('/optout', (msg) =>{
	let sqlcmd = "DELETE FROM optintable WHERE userid = " + hash(msg.from.id) + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, result){
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You opted out for data collection").then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimeoptout);
                        });
			connection.release();
		});
	});
});

bot.on('/checkcounting', (msg) => {
	let sqlcmd = "SELECT COUNT(*) AS logging FROM optintable where userid = " + hash(msg.from.id) + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null)).then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimecheckcounting);
                        });
			connection.release();
		});
	});
});

bot.on('/overallmsgs', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
        	        msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount,false,null)).then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimeoverallmsgs);
                        });
			connection.release();
	        });
	});
});

bot.on('/mymsgs', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
        	        msg.reply.text(msg.from.username + " current amount of own msgs is: " + util.inspect(rows[0].amount,false,null)).then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimemymsgs);
                        });
			connection.release();
	        });
	});
});

bot.on('/deletemymsgs', (msg) => {
        let sqlcmd = "DELETE FROM messagetable WHERE userid = " + hash(msg.from.id) + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
                	msg.reply.text("Your msgs have been deleted :(").then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimedeletemymsgs);
                        });
			connection.release();
	        });
	});
});

bot.on(['/start', '/help'], (msg) => {
	let startmsg = "Commands:\n/optin (agree to collecting your messages for counting your msgs)\n/optout (disable collection)\n/checklogging (check collection status)\n/overallmsgs (overall amount of msgs in group)\n/mymsgs (you're amount of msgs)\n/deletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP. S. All data is anonymized";
	msg.reply.text(startmsg).then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimestart);
                        });
	bot.deleteMessage(msg.chat.id, msg.message_id);
});

//updates userinformation
bot.on('/updateuserinfo', (msg) => {
        let sqlcmd = "UPDATE optintable SET username = ? WHERE userid = ?";
        var values = [msg.from.username, hash(msg.from.id)];
        db.getConnection(function(err, connection){
                connection.query(sqlcmd, values, function(err, result){
                        if(err) throw err;
			bot.deleteMessage(msg.chat.id, msg.message_id);
                        msg.reply.text("Your User infos have been updated").then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimeupdateuserinfo);
                        });
                        connection.release();
                });
        });
});

//updates userinformation
bot.on('/deleteuserinfo', (msg) => {
        let sqlcmd = "UPDATE optintable SET username = null WHERE userid = ?";
        var values = [hash(msg.from.id)];
        db.getConnection(function(err, connection){
		connection.query(sqlcmd, values, function(err, result){
                        if(err) throw err;
                        bot.deleteMessage(msg.chat.id, msg.message_id);
                        msg.reply.text("Your User infos have been updated").then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimedeleteuserinfo);
                        });
                        connection.release();
                });
        });
});

bot.on('/top', (msg) => {
        bot.sendAction(msg.chat.id, 'typing');
        let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, `optintable`.`username` AS `Username`";
        let FROM = " FROM { oj `counterdb`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `counterdb`.`optintable` AS `optintable` }";
        let GROUP = " GROUP BY `messagetable`.`userid`";
        let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
        let sqlcmd = SELECT + FROM + GROUP + ORDER;
        db.getConnection(function(err, connection) {
                connection.query(sqlcmd, function(err, rows){
                        if(err) throw err;
                        let result = "The top people writing msgs are: \n";
                        for(var i in rows)
                        {
                                let user = "";
                                if(rows[i].Username != null)
                                {
                                        user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
                                }else{
                                        user = ". " + rows[i].User;
                                }
                                result = result + i + user + " | Msgs#: " + rows[i].Msgs;
                                result = result + "\n";
                        }
                        result = result + "\nIf you want you're name to show up use: /updateuserinfo\nWhen you want to anonymize youreself again use /deleteuserinfo";
                        msg.reply.text(result, { parseMode: 'markdown' }).then(function(msg)
                        {
                                setTimeout(function(){
                                        bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                }, config.waittimetop);
                        });
			bot.deleteMessage(msg.chat.id, msg.message_id);
                        connection.release();
                });
        });
});

bot.on('/ping', (msg) => {
        msg.reply.text("Pong, Pung, Ping! Ente!!!! FOOOOOOOSSS!!!").then(function(msg)
		{
                	setTimeout(function(){
                        	bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                       	}, config.waittimeping);
               	});
	bot.deleteMessage(msg.chat.id, msg.message_id);
});

//sends a list containing the top 10 people writing msgs of today
bot.on('/toptoday', (msg) => {
                bot.sendAction(msg.chat.id, 'typing');
                let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, `optintable`.`username` AS `Username`";
                let FROM = " FROM { oj `counterdb`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `counterdb`.`optintable` AS `optintable` }";
                let WHERE = " WHERE DATE(`messagetable`.`time`) = CURDATE()";
                let GROUP = " GROUP BY `messagetable`.`userid`";
                let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
                let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
                db.getConnection(function(err, connection) {
                        connection.query(sqlcmd, function(err, rows){
                                if(err) throw err;
                                let result = "The top people writing msgs are: \n";
                                for(var i in rows)
                                {
                                        let user = "";
                                        if(rows[i].Username != null)
                                        {
                                                user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
                                        }else{
                                                user = ". " + rows[i].User;
                                        }
                                        result = result + i + user + " | Messages#: " + rows[i].Msgs;
                                        result = result + "\n";
                                }
                                result = result + "\nIf you want you're name to show up use: /updateuserinfo\nWhen you want to anonymize youreself again use /deleteuserinfo";
                                if(msg.chat.type!="private")
                                {
                                        bot.deleteMessage(msg.chat.id, msg.message_id);
                                }
				msg.reply.text(result, { parseMode: 'markdown' }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                                connection.release();
                        });
                });
});

//sends a list containing the top 10 people writing msgs of the last week
bot.on('/top1week', (msg) => {
                bot.sendAction(msg.chat.id, 'typing');
                let SELECT = "SELECT DISTINCT COUNT( `messagetable`.`msgid` ) AS `Msgs`, `messagetable`.`userid` AS `User`, `optintable`.`username` AS `Username`";
                let FROM = " FROM { oj `counterdb`.`messagetable` AS `messagetable` NATURAL LEFT OUTER JOIN `counterdb`.`optintable` AS `optintable` }";
		let WHERE = " WHERE (`messagetable`.`time` > (now() - INTERVAL 1 WEEK))";
                let GROUP = " GROUP BY `messagetable`.`userid`";
                let ORDER = " ORDER BY `Msgs` DESC LIMIT 10;";
                let sqlcmd = SELECT + FROM + WHERE + GROUP + ORDER;
                db.getConnection(function(err, connection) {
                        connection.query(sqlcmd, function(err, rows){
                                if(err) throw err;
                                let result = "The top people writing msgs are: \n";
                                for(var i in rows)
                                {
                                        let user = "";
                                        if(rows[i].Username != null)
                                        {
                                                user = ". [" + rows[i].Username + "](t.me/" + rows[i].Username + ")";
                                        }else{
                                                user = ". " + rows[i].User;
                                        }
                                        result = result + i + user + " | Messages#: " + rows[i].Msgs;
                                        result = result + "\n";
                                }
                                result = result + "\nIf you want you're name to show up use: /updateuserinfo\nWhen you want to anonymize youreself again use /deleteuserinfo";
                                if(msg.chat.type!="private")
                                {
                                        bot.deleteMessage(msg.chat.id, msg.message_id);
                                }
				msg.reply.text(result, { parseMode: 'markdown' }).then(function(msg)
                                {
                                        setTimeout(function(){
                                                bot.deleteMessage(msg.result.chat.id,msg.result.message_id);
                                        }, 60000);
                                });
                                connection.release();
                        });
                });
});
