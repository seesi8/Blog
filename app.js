const express = require('express')
const bodyparser = require("body-parser");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const articleRouter = require('./public/routes/articles')
const methodOverride = require('method-override')
const app = express()
const http = require('http');
const multer = require("multer");
var mysql = require('mysql');
const cors = require("cors");
const { strictEqual } = require('assert');
var hoxy = require('hoxy');


app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.set('views', path.join(__dirname, '/public', '/views'));
app.use(express.static(__dirname + '/public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }))
// This middleware is used to enable Cross Origin Resource Sharing This sets Headers to allow access to our client application
app.use(cors());
app.use(session({
  secret: uuidv4(), //  '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
  resave: false,
  cookie: { secure: false },
  saveUninitialized: true
}));

var con = mysql.createConnection({
  connectionLimit: 100,
  host: "blogbase.hytools.net",
  user: "seesi",
  password: "saml3651",
  database: "blogbase_hytools"
});

function compare(a, b) {
  if (a.createdAt < b.createdAt) {
    return -1;
  }
  if (a.createdAt > b.createdAt) {
    return 1;
  }
  return 0;
}

function comparepop(a, b) {
  if (a.pop < b.pop) {
    return -1;
  }
  if (a.pop > b.pop) {
    return 1;
  }
  return 0;
}

function insert(Title, Description, Markdown, tags, pop, slug, sanitizedHtml, multerphoto, author) {
  con.connect(function (err) {
    console.log(err)
    if (err) throw err;
    query_params = "INSERT INTO articles (Title, Description, Markdown, tags, pop, slug, sanitizedHtml, multerphoto, author) VALUES ('" + Title + "','" + Description + "','" + Markdown + "','" + tags + "','" + pop + "','" + slug + "','" + sanitizedHtml + "','" + multerphoto + "','" + author + "')"
    console.log(query_params)
    con.query(query_params, function (err, result, fields) {
      console.log(err)
      if (err) throw err;
      console.log(result);
    });
    con.query("SELECT * FROM articles", function (err, result, fields) {
      console.log(err)
      if (err) throw err;
      console.log(result);
    });
  });

}

/*--
query_params = "INSERT INTO articles (Title, Description, Markdown, tags, pop, slug, sanitizedHtml, multerphoto, author) VALUES ('" + Title + "','" + Description + "','" + Markdown + "','" + tags + "','" + pop + "','" + slug + "','" + sanitizedHtml + "','" + multerphoto + "','" + author + "')"
  con.connect(function(err){
    if (err) console.log(err)

    con.query('select * from articles', function (err, result) {
      console.log(result)



            for (let index in article){
        console.log(article[index].tags)
        article[index].tags = JSON.parse(article[index].tags)
      }

      UPDATE `tableName` SET `fieldName` = 'value' WHERE `fieldName` = 'value'

--*/


app.get('/', async (req, res) => {
  const config = {
    host: "blogbase.hytools.net",
    user: "seesi",
    password: "saml3651",
    database: "blogbase_hytools"
  };
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from articles', function (err, result) {
      console.log(result)
      var article = result.sort(compare)
      var tags = [];
      for (let index in article) {
        console.log(article[index].tags)
        article[index].tags = JSON.parse(article[index].tags)
      }
      for (let index in article) {
        for (let subindex in article[index].tags) {
          tags.push(article[index].tags[subindex])
        }
      }
      var frequency = {};  // array of frequency.
      for (var v in tags) {
        frequency[tags[v]] = (frequency[tags[v]] || 0) + 1; // increment frequency.
      }
      let sortable = [];
      for (var tag in frequency) {
        sortable.push([tag, frequency[tag]]);
      }
      sortable.push(["buffer", 0], ["buffer", 0], ["buffer", 0], ["buffer", 0], ["buffer", 0], ["buffer", 0], ["buffer", 0], ["buffer", 0])

      sortable.sort(function (a, b) {
        return b[1] - a[1];
      });
      tags = sortable
      console.log(sortable)
      console.log(tags[2])



      if (!req.query.page) req.query.page = "1";
      page = req.query.page
      req.query.page = [eval((req.query.page * 10) - 10), req.query.page * 10]
      var articlescreatedat = result.sort(compare)
      const possible_page = Math.ceil(eval(articlescreatedat.length / 10))
      articlescreatedat = articlescreatedat.slice(req.query.page[0], req.query.page[1])
      var articlespop = result.sort(comparepop)
      articlespop = articlespop.slice(req.query.page[0] * 3, req.query.page[1] * 3)
      console.log(result)
      if (req.session.username) {

        res.render('articles/index', { tags: tags, page: page, max: possible_page, articlespop: articlespop, articlescreatedat: articlescreatedat, articles: articlescreatedat, user: req.session })
      }
      else {
        res.render('articles/index', { tags, tags, page: page, max: possible_page, articlespop: articlespop, articlescreatedat: articlescreatedat, articles: articlescreatedat, user: { username: "No User", password: "no user", filename: "/icons/default.png" } })
      }
    });
  })
})

app.use('/articles', articleRouter)

app.listen(5000)