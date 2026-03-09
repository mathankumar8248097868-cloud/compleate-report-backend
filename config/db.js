const mysql = require("mysql2")

// connect without database first
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
})

// connect
db.connect(err => {

  if(err){
    console.log("Database connection error",err)
    return
  }

  console.log("MySQL Connected")

  // ================= CREATE DATABASE =================

  db.query("CREATE DATABASE IF NOT EXISTS dental_camp", (err)=>{
    if(err) console.log(err)

    console.log("Database ready")

    // use database
    db.changeUser({database:"dental_camp"}, err=>{

      if(err){
        console.log(err)
        return
      }

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
        if(err) console.log(err)
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
        if(err) console.log(err)
        else console.log("Reports table ready")
      })

    })

  })

})

module.exports = db