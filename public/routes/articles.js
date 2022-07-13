const express = require('express')
const router = express.Router()
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const mcache = require("memory-cache");
const marked = require('marked')
const slugify = require('slugify')
const createDomPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window)
var mysql = require('mysql');
const { endianness } = require('os');
const session = require('express-session');

function Article() {
  this.title = "";
  this.description = "";
  this.markdown = "";
  this.tags = [];
  this.pop = 0;
  this.slug = "";
  this.sanitisedHTML = "";
  this.multerphoto = "";
  this.author = "";
}

function Password(correct, path, id) {
  this.correct = correct;
  this.path = path;
  this.id = id;
}

function Users() {
  this.username = "";
  this.profilepic = "";
  this.password = "";
  this.likedposts = [];
}


function genUpdate(Title, Description, Markdown, tags, pop, slug, multerphoto, author, id) {
  return ("UPDATE articles SET (Title, Description, Markdown, tags, pop, slug, sanitizedHtml, multerphoto, author) VALUES ('" + Title + "','" + Description + "','" + Markdown + "','" + JSON.stringify(tags) + "','" + pop + "','" + slug + "','" + dompurify.sanitize(marked.parse(Markdown)) + "','" + multerphoto + "','" + author + "') where id = '" + id + "'")
}

function genInsert(Title, Description, Markdown, tags, pop, slug, multerphoto, author, id) {
  return ("INSERT INTO articles (Title, Description, Markdown, tags, pop, slug, sanitizedHtml, multerphoto, author) VALUES ('" + Title + "','" + Description + "','" + Markdown + "','" + JSON.stringify(tags) + "','" + pop + "','" + slug + "','" + dompurify.sanitize(marked.parse(Markdown)) + "','" + multerphoto + "','" + author + "')")
}

function genUser(username, profilepic, password, likedposts, admin) {
  return ("INSERT INTO users (username, profilepic, password, likedposts, admin) VALUES ('" + username + "','" + profilepic + "','" + password + "','" + JSON.stringify(likedposts) + "','" + admin+ "')")
}
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

const credential = {
  email: "samuelliebert@gmail.com",
  password: "saml3651"
}

router.post('/newsletter', function (req, res) {
  // save user details to your database.
  res.send('Signed Up!');
});

var con = mysql.createConnection({
  connectionLimit: 100,
  host: "blogbase.hytools.net",
  user: "seesi",
  password: "saml3651",
  database: "blogbase_hytools"
});


router.get('/posts', async (req, res) => {
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from articles', function (err, result) {
      var article = result.sort(compare)
      var tags = [];
      for (let index in article) {
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
      if (req.session.username) {

        res.render('articles/posts', { tags: tags, page: page, max: possible_page, articlespop: articlespop, articlescreatedat: articlescreatedat, articles: articlescreatedat, user: req.session })
      }
      else {
        res.render('articles/posts', { tags, tags, page: page, max: possible_page, articlespop: articlespop, articlescreatedat: articlescreatedat, articles: articlescreatedat, user: { username: "No User", password: "no user", filename: "/icons/default.png" } })
      }
    });
  })
})

router.get('/tag/:tag', async (req, res) => {
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from articles', function (err, result) {
      var article = result
      for (let index in article) {
        console.log(article[index].tags)
        article[index].tags = JSON.parse(article[index].tags)
      }
      const articles = result.sort(compare)
      articleswithtag = []
      for (let x in articles) {
        if (articles[x].tags.includes(req.params.tag)) {
          articleswithtag.push(articles[x])
        }
      }
      console.log(articleswithtag)
      if (req.session.username) {
        res.render('articles/tag', { articles: articleswithtag, user: req.session })
      }
      else {
        res.render('articles/tag', { articles: articleswithtag, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
      }
    })
  })

})


router.get('/about', (req, res) => {
  if (req.session.username) {
    res.render('articles/about', { user: req.session })
  }
  else {
    res.render('articles/about', { user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
  }
})

router.get('/edit/:id/:method', async (req, res) => {
  var id = req.params.id;
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from articles where id = "' + id + '"', function (err, result) {
      console.log(result)

      try {
        const article = result
        if (req.session.username) {
          res.render('articles/edit', { articles: articles, user: req.session })
        }
        else {
          res.render('articles/edit', { articles: articles, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
        }
      } catch (err) {
        res.status(400) // or some other error repsonse
        return res.render('your error page')
      }
    })
  })
})
// Storage Engin That Tells/Configures Multer for where (destination) and how (filename) to save/upload our files
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images"); //important this is a direct path fron our current file to storage location
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + file.originalname);
  },
});

const userImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./icons"); //important this is a direct path fron our current file to storage location
  },
  filename: (req, file, cb) => {
    cb(null,uuidv4() +  file.originalname);
  },
});

// The Multer Middleware that is passed to routes that will receive income requests with file data (multipart/formdata)
// You can create multiple middleware each with a different storage engine config so save different files in different locations on server
const upload = multer({ storage: fileStorageEngine });
const uploadusrimg = multer({ storage: userImageStorage });

router.get('/new_account', async (req, res) => {
  if (req.session.username) {
    res.render('articles/newuser', { user: req.session, unique: "" })
  }
  else {
    res.render('articles/newuser', { user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] }, unique: "" })
  }
})

router.get('/:slug', async (req, res) => {
  con.connect(function (err) {
    console.log("here")
    if (err) console.log(err)

    con.query('select * from articles where slug = "' + req.params.slug + '" limit 1', function (err, result) {
      console.log(err)
      console.log(result)
      console.log(req.session)
      const { slug } = req.params        // destructure slug from params
      if (!slug) return res.render('/')  // check if provided
      const article = result[0]
      console.log(article.sanitizedHtml)
      
      if (req.session.username) {
        console.log(req.session.likedposts)
        return res.render('articles/show', { article: article, user: req.session })
      }
      else {
        return res.render('articles/show', { article: article, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
      }

    })
  })

})

router.post('/popplus/:id/:minus', async (req, res, next) => {

  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from users where username ="' + req.session.username + '" limit 1', function (err, result) {
      console.log(result)
      var id = req.params.id;
      var minus = req.params.minus
      const user = result
      console.log(user)
      console.log(minus)
      //check weather to add or subtact
      if (minus == "plus") {
        //see if signed in
        if (user) {
          //fix tags
          for (let index in user) {
            console.log(user[index].likedposts)
            user[index].likedposts = JSON.parse(user[index].likedposts)
            //see if user has liked the post
            if (!user.likedposts.includes(id)) {
              //find artile that needs to be added to
              con.query('select * from articles where id ="' + id + '" limit 1 ', function (err, resultid) {
                req.article = resultid
                req.article.pop += 1
                user.likedposts.push(id)
                //update database
                con.query('UPDATE `articles` SET `pop` = "' + req.article.pop + '" WHERE id ="' + id + '" "fieldName" = "value"', function (err) {
                  con.query('UPDATE `users` SET `likedposts` = "' + JSON.stringify(user.likedposts) + '" WHERE id ="' + id + '" "fieldName" = "value"', function (err) {
                    //update session and finsih
                    req.session.likedposts.push(id);
                    req.session.save()
                    res.send("done")
                  })


                })
              })
            }
            else {
              console.log("already liked this post")
              res.send({ errormsg: "already liked this post" });
            }
          }
        }
        else {
          console.log("sighn in");
          res.json({ errormsg: "must sighn in to like posts" })
        }
      }
      else {
        //substract
        const user = result
        if (user) {
          //fix likedposts
          for (let index in user) {
            user[index].likedposts = JSON.parse(user[index].likedposts)
          }
          if (user.likedposts.includes(id)) {
            console.log("here")
            con.query('select * from articles where id ="' + id + '" limit 1 ', function (err, resultid) {
              req.article = resultid
              req.article.pop -= 1
              user.likedposts.splice(user.likedposts.indexOf(id), 1)
              //update sql
              con.query('UPDATE `articles` SET `pop` = "' + req.article.pop + '" WHERE id ="' + id + '" "fieldName" = "value"', function (err) {
                con.query('UPDATE `users` SET `likedposts` = "' + JSON.stringify(user.likedposts) + '" WHERE id ="' + id + '" "fieldName" = "value"', function (err) {
                  //update session
                  req.session.likedposts = user.likedposts
                  console.log(req.session)
                  req.session.save()
                  res.send("done")
                })
              })

            })
          }
          else {
            console.log("You have not liked this post")
            res.send({ errormsg: "You have not liked this post" });
          }
        }
        else {
          console.log("sighn in");
          res.json({ errormsg: "must sighn in to like posts" })
        }
      }
    })
  })

})

router.post('/', upload.single("image"), async (req, res, next) => {
  console.log("here")
  req.article = new Article()
  next()
}, saveArticleAndRedirect('new'))


router.post('/newuser', uploadusrimg.single("primage"), async (req, res, next) => {
  con.connect(function (err) {
    con.query('select * from users where username ="' + req.session.username + '" limit 1', function (err, result) {
      const user = result
      if (!user) {
        req.users = new Users()
        let users = req.users
        users.username = req.body.username
        users.password = req.body.password
        if (req.body.adminpassword == "saml3651") {
          users.admin = true;
        }
        else{
          users.admin = false
        }
        users.profilepic = "/icons/" + req.file.filename;
        req.session.username = req.body.username;
        req.session.password = req.body.password;
        req.session.filename = "/icons/" + req.file.filename;
        console.log(req.session)
        req.session.likedposts = ["test", "test2"]
        res.redirect('/')
        con.query(genUser(req.body.username, req.file.filename, req.body.password, ["test", "test2"], users.admin), function (err, result) {
          if(err) throw (err)
          console.log(err)
          console.log(result)
        })
      }
      else {
        if (req.session.username) {
          res.render('articles/newuser', { user: req.session, unique: "Username Taken" })
        }
        else {
          res.render('articles/newuser', { user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] }, unique: "Username Taken" })
        }
      }
    })
  })

})

router.get('/password/:path/:id', async (req, res) => {
  let path = req.params.path
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from users where username = "' + req.session.username + '"', function (err, result) { 

      const user = result
      console.log(user == true)
      if (user == true) {
        if (req.body.username == user.username || req.body.password == user.password || user.admin) {
          if (path == "edit") {
            con.query('select * from users where id = "' + req.params.id + '"', function (err, resultid) {
              article = resultid
              if (article) {
                if (req.session.username) {
                  res.render(`articles/edit`, { article: article, user: req.session })
                  res.end()
                }
                else {
                  res.render(`articles/edit`, { article: article, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
                  res.end()
                }
              }
              else {
                res.redirect('/')
                res.end()
              }
            })
          }
          else if (path == "new") {
            console.log("new")
            if (req.session.username) {
              console.log("about to render")
              res.render('articles/new', { article: new Article(), user: req.session })
              res.end()
            }
            else {
              res.render(`articles/new`, { article: new Article(), user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
              res.end()
            }
          }
        }


      }
      var password = new Password("", path, req.params.id);
      if (req.session.username) {
        res.render('articles/password', { password: password, user: req.session })
      }
      else {
        res.render('articles/password', { password: password, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
      }
      console.log(password.correct)
    })
  })
})

router.patch('/password/:path/:id/:method', async (req, res, path) => {
  var path = req.params.path
  var id = req.params.id
  con.connect(function (err) {
    if (err) console.log(err)
    console.log(req.body.username)
    con.query("SELECT * FROM users WHERE username = '"+req.body.username+"' LIMIT 1", function (err, result) {
      console.log(err)
      const user = result[0]
      console.log(user)
      if (user) {

        console.log(req.body.username, req.body.password, user.username, user.password)
        console.log(req.body.username == user.username)
        console.log(req.body.password == user.password)
        console.log(path)
        if (req.body.username == user.username) {
          if (req.body.password == user.password) {
            if (path == "new") {
              if (user.admin) {
                req.session.username = user.username;
                req.session.password = user.password;
                req.session.filename = user.profilepic;
                req.session.likedposts = user.likedposts;
                if (req.session.username) {
                  res.render('articles/new', { article: new Article(), user: req.session })
                }
                else {
                  res.render(`articles/new`, { article: new Article(), user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
                }
              }
              else {
                console.log("wrong")
                var password = new Password("Sorry Only Admins Can Post Articles", req.params.path, req.params.id);
                if (req.session.username) {
                  res.render('articles/password', { password: password, user: req.session })
                }
                else {
                  console.log("renderinig")
                  res.render('articles/password', { password: password, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })

                }
              }
            }
            else if (path == "login") {
              req.session.username = user.username;
              req.session.password = user.password;
              req.session.filename = user.profilepic;
              req.session.likedposts = user.likedposts;
              res.redirect('/')
            }
            // this means edit
            else {
              console.log("hi" + id)
              console.log("test")
              con.connect(function (err) {
                if (err) console.log(err)

                con.query('select * from articles where id = "' + id + '" LIMIT 1', function (err, result) {
                  const article = result;
                  if (article) {
                    if (req.session.username) {
                      res.render(`articles/edit`, { article: article, user: req.session })
                    }
                    else {
                      res.render(`articles/edit`, { article: article, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
                    }
                  }
                  else {
                    res.redirect('/')
                  }
                })
              })
            }
          }
        }
      }
      console.log("wrong")
      var password = new Password("Incrroect Username Or Passwords", req.params.path, req.params.id);
      if (req.session.username) {
        res.render('articles/password', { password: password, user: req.session })
      }
      else {
        res.render('articles/password', { password: password, user: { username: "No User", password: "no user", filename: "/icons/default.png", likedposts: ["test", "test2"] } })
      }
    })
  })
})

router.put('/:id', upload.single("image"), async (req, res, next) => {
  var id = req.params.id;
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('select * from users where id = "' + id + '" LIMIT 1', function (err, result) {
      req.article = result
      next()
    })
  })
}, saveArticleAndRedirect('edit'))

router.delete('/:id', async (req, res) => {
  var id = req.params.id;
  con.connect(function (err) {
    if (err) console.log(err)

    con.query('delete * from articles where id ="' + id + '" LIMIT 1', function (err) {
      res.redirect('/')
    })

  })
})

function saveArticleAndRedirect(path) {
  return async (req, res) => {
    console.log("filename", req.file.filename)
    let article = req.article
    article.title = req.body.title
    article.description = req.body.description.replace(/[",',`]+/g, '')
    article.markdown = req.body.markdown.replace(/[",',`]+/g, '')
    article.pop = req.body.pop
    article.author = req.session.username
    article.tags = req.body.tags.split(',')
    article.multerphoto = req.file.filename
    var slug = uuidv4()
    console.log("jere");
    con.query(genUpdate(article.title, article.description, article.markdown, ['test', 'test2'], article.pop, slug, article.multerphoto, article.author, req.params.id), function (err, numUpdated) {
      if (!numUpdated) {
        console.log(article.multerphoto, typeof article.multerphoto)
        con.query(genInsert(article.title, article.description, article.markdown, ['test', 'test2'], article.pop, slug, article.multerphoto, article.author), function (err, result) {
          console.log(err)
        })
      }
      console.log("edit")
      res.redirect(`/articles/${slug}`)
    })
  }
}

module.exports = router