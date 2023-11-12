//utilisation du Node.js avec Express pour créer le serveur backend
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

//traitement requêtes au format JSON
app.use(bodyParser.json());


// Classe compte bancaire définit un compte client chez la banque
class CompteBancaire {

  constructor(credit = 0) {   //crédit par défaut est nulle
    this.credit = credit;
    this.operations = [];   //liste des opérations faites sur un compte bancaire (type de la transaction : ajouter ou retirer ou virement ou reception, la somme, la date de la transaction )
  }       

  //fonction pour déposer des devises
  async AddMoney(somme) {
    this.credit += somme;
    let transaction = { 
        TransactionType: "ajouter", 
        somme, 
        TransactionDate: new Date() 
    };
    this.operations.push(transaction);
  }

  //fonction pour retirer des devises
  async withdrawMoney(somme) {
    if (this.credit - somme >= 0) { //si le credit suffit pour retirer la somme
      this.credit -= somme;
      let transaction = { 
        TransactionType: "retirer", 
        somme, 
        TransactionDate: new Date() 
      };
      this.operations.push(transaction);
    } else {
      throw new Error("Ton crédit ne suffit pas pour retirer cette somme d'argent");
    }
  }

  //fonction pour effectuer un virement bancaire
  async virementBancaire(recepteur, somme) {
    if (this.credit - somme >= 0) {
      this.credit -= somme;
      await recepteur.AddMoney(somme);
      let virement = {
        TransactionType: "virement", 
        somme, 
        TransactionDate: new Date()
      };
      this.operations.push(virement);
      let reception = {
        TransactionType: "reception", 
        somme, 
        TransactionDate: new Date()
      };
      recepteur.operations.push(reception);
    } else {
      throw new Error("Ton crédit ne suffit pas pour faire le virement de cette somme d'argent");
    }
  }

  //fonction pour lister la liste des opérations sur les comptes
  async OperationsHistory() {
    return this.operations;
  }
}

//création des endpoints pour les requêtes faites côté client

//Classe clinet qui représent un client de la banque
class Client {
    constructor(identifiant) {  //un user a un identifiant client
      this.identifiant = identifiant;
      this.comptesBancaire = [];
    }
  
    //fonction pour créer un nouveau compte
    async createCompteBancaire(credit) {
      let compte = new CompteBancaire(credit);
      this.comptesBancaire.push(compte);
      return compte;
    }
  
    //fonction pour accéder à la liste des comptes d'un user
    async listOfComptes() {
      return this.comptesBancaire;
    }
}



//clients est un objet qui représente les clients de la banque (objets de la classe Client)
let clients = [];

//Créer un nouveau compte bancaire client
app.post('/clients/:clientId/compte/create', async (req, res) => {
    let clientId = req.params.clientId;
    let credit = req.body.credit;
    
    let client = clients.find(client => client.id === clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Compte non trouvé" });
    }

    let compte = await client.createCompteBancaire(credit);
    res.json({ success: true, compte });
});

//Demander la liste des comptes bancaires d'un user
app.get('/clients/:clientId/comptes', async (req, res) => {
    let clientId = req.params.clientId;
    let client = clients.find(client => client.id === clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: "Compte non trouvé" });
    }
  
    let comptes = await client.listOfComptes();
    res.json({ success: true, comptes });
});


//Déposer des devises  
app.post('/clients/:clientId/compte/:compteId/add', async (req, res) => {
    
    let clientId = req.params.clientId;
    let compteId = req.params.compteId;
    let credit = req.body.credit;
    let client = clients.find(client => client.id === clientId);
    let compte = client.comptesBancaire.find(compte => compte.id === compteId);

    if (!compte) {
      return res.status(404).json({ success: false, message: "Compte non trouvé" });
    }
  
    await compte.AddMoney(credit);
    res.json({ success: true, credit: compte.credit });
});

//Retirer des devises
app.post('/clients/:clientId/compte/:compteId/withdraw', async (req, res) => {
    let clientId = req.params.clientId;
    let compteId = req.params.compteId;
    let credit = req.body.credit;
    let client = clients.find(client => client.id === clientId);
    let compte = client.comptesBancaire.find(compte => compte.id === compteId);

    if (!compte) {
      return res.status(404).json({ success: false, message: "Compte non trouvé" });
    }
  
    try {
      await compte.withdrawMoney(credit);
      res.json({ success: true, credit: compte.credit });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
});


//faire un virement bancaire
app.post('/clients/:clientId/compte/:compteId/virement/:recepteurId', async (req, res) => {
    let clientId = req.params.clientId;
    let compteId = req.params.compteId;
    let recepteurId = req.params.recepteurId;
    let somme = req.body.somme;
    let client = clients.find(client => client.id === clientId);
    let compte = client.comptesBancaire.find(compte => compte.id === compteId);
    let recepteur = clients.find(client => client.id === recepteurId);
    
    if (!compte || !recepteur) {
      return res.status(404).json({ success: false, message: "Compte non trouvé" });
    }
  
    try {
      await compte.virementBancaire(recepteur, somme);
      res.json({ success: true, somme: compte.somme });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
});

//Consulter l’historique des opérations effectuées sur mes comptes 
app.get('/clients/:clientId/compte/:compteId/history', async (req, res) => {
    
    let clientId = req.params.clientId;
    let compteId = req.params.compteId;
    let client = clients.find(client => client.id === clientId);
    let compte = client.comptesBancaire.find(compte => compte.id === compteId);
  
    if (!compte) {
      return res.status(404).json({ success: false, message: "Compte non trouvé" });
    }
  
    let history = await compte.OperationsHistory();
    res.json({ success: true, history });
  });


//lancement du serveur backend sur le port 3000
app.listen(port, () => {
    console.log(`Serveur backend sur http://localhost:${port}`);
});