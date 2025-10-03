const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql');

const app = express();

// Config EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: 'monsecret',
  resave: false,
  saveUninitialized: true
}));

// Pool de connexions MySQL
const pool = mysql.createPool({
  connectionLimit: 10,
  host : '192.168.4.1',
  user : 'sqlclebosse',
  password : 'savary85*',
  database : 'clebosse_miniblog',
  ssl : {
    rejectUnauthorized: false
  }
});

// Middleware d’authentification
function authMiddleware(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

// === ROUTES ===

// Page de login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});
users = [username = "admin", password = "P@ssw0rd"
          
]
// Vérification login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'P@ssw0rd') {
    req.session.loggedIn = true;
    req.session.username = username;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Identifiants incorrects' });
  }
});

// Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Page d’accueil : afficher les articles (accessible à tous)
app.get('/', (req, res) => {
  const sql = "SELECT * FROM articles";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
    }
    res.render('index', { 
      articles: results, 
      username: req.session.username, 
      loggedIn: req.session.loggedIn 
    });
  });
});

// Formulaire création article (accessible uniquement connecté)
app.get('/new', authMiddleware, (req, res) => {
  res.render('new');
});

// Créer un article (accessible uniquement connecté)
app.post('/new', authMiddleware, (req, res) => {
  const { title, content, image } = req.body;
  const sql = "INSERT INTO articles (title, content, image) VALUES (?, ?, ?)";
  pool.query(sql, [title, content, image], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
    }
    res.redirect('/');
  });
});

// Afficher un article et ses commentaires (accessible à tous)
app.get('/article/:id', (req, res) => {
  const { id } = req.params;
  const articleQuery = "SELECT * FROM articles WHERE id = ?";
  const commentaireQuery = "SELECT * FROM commentaire WHERE `from` = ? ORDER BY date DESC"; // <-- backticks

  pool.query(articleQuery, [id], (err, articleResult) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
    }
    if (articleResult.length > 0) {
      pool.query(commentaireQuery, [id], (err, commentaireResult) => {
        if (err) {
          console.error(err);
          return res.render('article', { article: articleResult[0], commentaire: [], username: req.session.username, loggedIn: req.session.loggedIn });
        }
        res.render('article', { article: articleResult[0], commentaire: commentaireResult, username: req.session.username, loggedIn: req.session.loggedIn });
      });
    } else {
      res.redirect('/');
    }
  });
});

// Ajouter un commentaire à un article (accessible à tous)
app.post('/article/:id/comment', (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  // Vérifie seulement que le commentaire n'est pas vide
  if (!comment || comment.trim().length === 0) {
    return res.status(400).send("Le commentaire ne peut pas être vide.");
  }

  const sql = "INSERT INTO commentaire (`from`, comm, date) VALUES (?, ?, NOW())";
  pool.query(sql, [id, comment], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
    }
    res.redirect(`/article/${id}`);
  });
});

// Supprimer un article par son id (accessible uniquement connecté)
app.post('/delete/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM articles WHERE id = ?";
  pool.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erreur serveur, veuillez réessayer plus tard.");
    }
    res.redirect('/');
  });
});

// Lancer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});