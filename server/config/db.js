// Load environment variables
const dotenv = require('dotenv');


const path = require('path');

// Always load .env from the server folder
dotenv.config({ path: path.join(__dirname, '../.env') });


// Get the client
const mysql = require('mysql2');

// console.log("DB_Password from env:", process.env.DB_Password);


// Create the connection to database

  const connection =  mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_User,
    password: process.env.DB_Password,
    database:process.env.DB_Name,
  });

 

module.exports = connection;
