//Fix Bug duplicates in visited_countries 
//possible breach of info today: 05/11/2024

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3012;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var currentUserId = 1;

/*let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];*/

async function checkVisisted() {
  const result = await db.query("SELECT country_code  FROM visited_countries WHERE user_id = $1 " , [`${currentUserId}`]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function checkUsers(){
  const result = await db.query("SELECT * FROM users");
  let users = [];
  result.rows.forEach((user)=>{
    users.push(user);
  });
  
  return users;
}

async function checkColor(){
  const result = await db.query("SELECT color FROM users WHERE id = $1;" , [`${currentUserId}`]);
  const data = result.rows[0];
  const color = data.color;
  return color;
}



app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users = await checkUsers();
  const userColor = await checkColor();

  
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: userColor,
  });
});

app.post("/add", async (req, res) => {

  

  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    
    try {
        
        await db.query(
          "INSERT INTO visited_countries (country_code , user_id) VALUES ($1 , $2)",
          [countryCode , currentUserId]
        ); 
        res.redirect("/");
      
      
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      const users = await checkUsers();
      const userColor = await checkColor();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: userColor,
        error:"This person has already visited this country, try again!"
      });
      
      
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    const users = await checkUsers();
    const userColor = await checkColor();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: userColor,
      error:"Country does not exists, try again!"
    });

  }
});

app.post("/delete", async (req, res) => {

  

  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    
    try {
        
        await db.query(
          "DELETE FROM visited_countries WHERE country_code = $1 AND user_id = $2 ;",
          [countryCode , currentUserId]
        ); 
        res.redirect("/");
      
      
    } catch (err) {
      console.log(err);
      console.log(err);
      const countries = await checkVisisted();
      const users = await checkUsers();
      const userColor = await checkColor();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: userColor,
        error:"Cannot delete country, the user has not been to this country yet, try again!"
      });
      
      
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    const users = await checkUsers();
    const userColor = await checkColor();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: userColor,
      error:"Country does not exists, try again!"
    });

  }
});




app.post("/user", async (req, res) => {
  if(req.body.add === "new"){
    res.render("new.ejs");
  
  }else if(req.body.add === "remove"){

    res.render("delete.ejs");
    

  }else{
    currentUserId = req.body.user;
    res.redirect("/");

  }

  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  const name = req.body.name;
  const color = req.body.color;
  try{
    
    
    const result = await db.query("INSERT INTO users(name, color) VALUES ($1, $2)" , [name, color]);
    res.redirect("/");

  }catch(err){
    console.log(err);
    const countries = await checkVisisted();
    const users = await checkUsers();
    const userColor = await checkColor();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: userColor,
      error:"Cannot add the same user!"
    });
    
  }
  

  
});


app.post("/remove" , async (req, res)=>{

  const name = req.body.name;

  try{
    const deletion = await db.query("SELECT id FROM users WHERE name =$1" , [name]);
    const deletionID = deletion.rows[0].id;
    
    const result1 = await db.query("DELETE FROM visited_countries WHERE user_id = $1" , [deletionID]);
    const result = await db.query("DELETE FROM users WHERE name = $1" , [name]);

    const maxId = await db.query("SELECT MAX(id) FROM users; ");
    

    currentUserId = maxId.rows[0].max;
    console.log(maxId.rows[0]);
    
    
    res.redirect("/");
  }catch(err){
    console.log(err);
    const countries = await checkVisisted();
    const users = await checkUsers();
    const userColor = await checkColor();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: userColor,
      error:"Cannot delete user which does not exists!"
    });
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
