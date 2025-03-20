const mysql = require("mysql2");
require("dotenv").config();


const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER, 
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME 
});

connection.connect(err => {
    if (err) {
        console.error('MySQL Connection Error:', err);
        process.exit(1); 
    }
    console.log('MySQL Connected');
});

module.exports = connection;