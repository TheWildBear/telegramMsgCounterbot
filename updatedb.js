var config = require('./config');
const util = require('util');
const mysql = require('mysql');
const hash = require('hash-int');
var db = mysql.createPool({
        connectionLimit : 100,
        host: config.dbreaduserhost,
        user: config.dbreaduser,
        password: config.dbreaduserpwd,
        database: config.database,
        charset : 'utf8mb4'
});

let sqlcmd = "SELECT userid FROM optintable;";
let updatecmd = "UPDATE optintable SET userid = ";
let where = " WHERE userid = ";
let updatecmd2 = "UPDATE messagetable SET userid = ";

db.getConnection(function(err,connection){
	connection.query(sqlcmd, function(err,rows){
		for(var i in rows)
		{
			let hashedid = hash(rows[i].userid);
			let cmd = updatecmd + hashedid + where + rows[i].userid + ";" ;
			let cmd2 = updatecmd2 + hashedid + where + rows[i].userid + ";";
			console.log(cmd);
			console.log(cmd2);
			db.query(cmd);
			db.query(cmd2);
		}
	});
	connection.release();
	console.log("finished");
});
