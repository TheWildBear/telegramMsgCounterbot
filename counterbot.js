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
var fs = require('fs');
var log;
var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: config.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

bot.start();

bot.on('text', (msg) => {
	var checkoptin = "SELECT COUNT(*) AS checkOptin FROM optintable where userid = " + msg.from.id + ";";
	db.getConnection(function(err, connection){
                connection.query(checkoptin, function(err, rows){
			if(rows[0].checkOptin==1){
				var sqlcmd = "INSERT INTO messagetable (msgid, userid, groupid) VALUES ?";
			        var values = [[msg.message_id, msg.from.id, msg.chat.id]];
		        	db.query(sqlcmd, [values]);
			}
		});
	});
});

bot.on('/optin', (msg) => {
	let sqlcmd = "INSERT INTO optintable (userid) VALUES ?";
	var values = [[msg.from.id]];
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, [values], function(err, result){
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You opted in for data collection!");
		});
	});
});

bot.on('/optout', (msg) =>{
	let sqlcmd = "DELETE FROM optintable WHERE userid = " + msg.from.id + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, result){
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("You opted out for data collection");
		});
	});
});

bot.on('/checkcounting', (msg) => {
	let sqlcmd = "SELECT COUNT(*) AS logging FROM optintable where userid = " + msg.from.id + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
			msg.reply.text("Your current status is: " + util.inspect(rows[0].logging,false,null));
		});
	});
});

bot.on('/overallmsgs', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
        	        msg.reply.text("The current amount of overall msgs is: " + util.inspect(rows[0].amount,false,null));
	        });
	});
});

bot.on('/mymsgs', (msg) => {
        let sqlcmd = "SELECT COUNT(*) AS amount FROM messagetable WHERE userid = " + msg.from.id + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
        	        msg.reply.text(msg.from.username + " current amount of own msgs is: " + util.inspect(rows[0].amount,false,null));
	        });
	});
});

bot.on('/deletemymsgs', (msg) => {
        let sqlcmd = "DELETE FROM messagetable WHERE userid = " + msg.from.id + ";";
	db.getConnection(function(err, connection){
                connection.query(sqlcmd, function(err, rows){
			bot.deleteMessage(msg.chat.id, msg.message_id);
                	msg.reply.text("Your msgs have been deleted :(");
	        });
	});
});

bot.on(['/start', '/help'], (msg) => {
	let startmsg = "Commands:\n/optin (agree to collecting your messages for counting your msgs)\n/optout (disable collection)\n/checklogging (check collection status)\n/overallmsgs (overall amount of msgs in group)\n/mymsgs (you're amount of msgs)\n/deletemymsgs (remove all collected data from the DB)\n\nThis bot collects data which will be used in the future for analysis and learning big data. It's opt in and does not collect any data if you are opted out. I would appreciate if you would donate me you're data!\nP. S. All data is anonymized";
	msg.reply.text(startmsg);
	bot.deleteMessage(msg.chat.id, msg.message_id);
});

//updates userinformation
bot.on('/updateuserinfo', (msg) => {
        let sqlcmd = "UPDATE optintable SET username = ? WHERE userid = ?";
        var values = [msg.from.username, msg.from.id];
        db.getConnection(function(err, connection){
                connection.query(sqlcmd, values, function(err, result){
                        if(err) throw err;
                        //bot.deleteMessage(msg.chat.id, msg.message_id);
                        msg.reply.text("Your User infos have been updated");
                        connection.release();
                });
        });
});

//updates userinformation
bot.on('/deleteuserinfo', (msg) => {
        let sqlcmd = "UPDATE optintable SET username = null WHERE userid = ?";
        var values = [msg.from.id];
        db.getConnection(function(err, connection){
		connection.query(sqlcmd, values, function(err, result){
                        if(err) throw err;
                        //bot.deleteMessage(msg.chat.id, msg.message_id);
                        msg.reply.text("Your User infos have been updated");
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
                        msg.reply.text(result, { parseMode: 'markdown' });
                        connection.release();
                });
        });
});

bot.on('/ping', (msg) => {
        msg.reply.text("Pong, Pung, Ping! Ente!!!! FOOOOOOOSSS!!!");
});
