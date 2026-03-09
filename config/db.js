const mysql = require("mysql2")

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
})

db.connect(err => {

  if(err){
    console.log("Database connection error:", err)
    return
  }

  console.log("MySQL Connected")

  // ================= CREATE USERS TABLE =================

  const usersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(50),
    created_date DATE,
    created_time TIME
  )
  `

  db.query(usersTable,(err)=>{
    if(err) console.log("Users table error:",err)
    else console.log("Users table ready")
  })

  // ================= CREATE REPORTS TABLE =================

  const reportsTable = `
  CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    filename VARCHAR(255),
    created_date DATE,
    created_time TIME
  )
  `

  db.query(reportsTable,(err)=>{
    if(err) console.log("Reports table error:",err)
    else console.log("Reports table ready")
  })

})

module.exports = db
