const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

//un film a un id, un titre, une date, une note, un boolean pour dire s'il est déjà vu ou pas, un boolean pour dire s'il est dans les favoris ou pas
let listOfFilms = [{id,title,date,note,viewed,favorite}];

//Ajouter ou retirer un film à/de mes favoris
app.post('/films/:filmId/favorites/add', async (req, res) => {

  let filmId  = parseInt(req.params.filmId);
  let action = req.body.action;  //add ou delete de favoris
  let film = listOfFilms.find(film => film.id === filmId);

  if (!film) {
    return res.status(404).json({ success: false, message: "film non trouvé" });
  }
  if (action === "add"){
    film.favorite = true;
    res.json({ success: true, message: "le film est bien ajouté aux favoris" });
  }else if (action === "delete"){
    film.favorite = false;
    res.json({ success: true, message: "le film est bien retiré des favoris" });
  }
});

// Lister mes films favoris triés par date de sortie ou note globale
app.get('/films/favorites/list', async (req, res) => {
  
  let filter = req.body.filter;
  let listFilmsToSend = [];

  if (filter === "date") {
    listFilmsToSend = listFilmsToSend.sort((film1, film2) => new Date(film1.date) - new Date(film2.date));  //date ordre croissant
  } else if (filter === "note") {
    listFilmsToSend = listFilmsToSend.sort((film1, film2) => film1.note - film2.note);  //note ordre croissant
  }
  res.json({ success: true, listFilmsToSend });
});

//Marquer un film comme vu ou non vu (boolean)
app.post('/films/:filmId/viewed', async (req, res) => {
  
  let filmId  = parseInt(req.params.filmId);
  let viewed = req.body.viewed;  //vu ou non vu
  let film = listOfFilms.find(film => film.id === filmId);

  if (!film) {
    return res.status(404).json({ success: false, message: "film non trouvé" });
  }
  if(viewed == true){
    film.viewed = true;
    res.json({ success: true, message: "Film marqué comme vu" });
  }

});

//Lister les films vus et les films non vus
app.get('/films/list', async (req, res) => {
  
  let viewedFilms = listOfFilms.filter(film => film.viewed);
  let nonViewedFilms = listOfFilms.filter(film => !film.viewed);
  res.json({ success: true, viewedFilms, nonViewedFilms });
});


//lancement du serveur backend sur le port 3000
app.listen(port, () => {
  console.log(`Serveur backend sur http://localhost:${port}`);
});
