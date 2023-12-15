const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());


const db = new sqlite3.Database(':memory:');


//criação de tabelas com tratamento de erros
db.serialize(() => {
  db.run("CREATE TABLE cats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, votes INT)", (err) => {
    if (err) {
      console.error("Erro ao criar tabela");
      process.exit(1);
    }
  });

  db.run("CREATE TABLE dogs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, votes INT)", (err) => {
    if (err) {
      console.error("Erro ao criar tabela");
      process.exit(1);
    }
  });
});

app.post('/cats', (req, res) => {
  const name = req.body.name;
  db.run(`INSERT INTO cats (name, votes) VALUES ('${name}', 0)`, function(err) {
    if (err) {
      res.status(500).send("Erro ao inserir no banco de dados");
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});

app.post('/dogs', (req, res) => {
  const name = req.body.name;
  db.run(`INSERT INTO dogs (name, votes) VALUES ('${name}', 0)`, function(err) {
    if (err) {
      res.status(500).send("Erro ao inserir no banco de dados");
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});

app.post('/vote/:animalType/:id', (req, res) => {
  const { animalType, id } = req.params;
  //verifica se é o animal correto
  if (animalType !== 'cats' && animalType !== 'dogs') {
    return res.status(400).send("Tipo de animal inválido");
  }
  //verifica se é um numero inteiro
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).send("ID inválido");
  }

  const query = `UPDATE ${animalType} SET votes = votes + 1 WHERE id = ?`;
  db.run(query, [parsedId], function (err) {
    if (err) {
      return res.status(500).send("Erro ao atualizar o banco de dados");
    }
    if (this.changes === 0) {
      return res.status(404).send("ID não encontrado");
    }
    res.status(200).send("Voto computado");
  });
});

app.get('/cats', (req, res) => {
  db.all("SELECT * FROM cats", [], (err, rows) => {
    if (err) {
      res.status(500).send("Erro ao consultar o banco de dados");
    } else {
      res.json(rows);
    }
  });
});

app.get('/dogs', (req, res) => {
  db.all("SELECT * FROM dogs", [], (err, rows) => {
    if (err) {
      res.status(500).send("Erro ao consultar o banco de dados");
    } else {
      res.json(rows);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro!');
});

app.listen(port, () => {
  console.log(`Cats and Dogs Vote app listening at http://localhost:${port}`);
});