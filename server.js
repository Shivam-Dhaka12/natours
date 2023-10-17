const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Uncaught Exception! Shutting down.....');
  console.log(err.name, err.message, err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require(`${__dirname}/app`);

// DB connection using mongoose
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);
let server;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => { 
    console.log('DB conncection successful!');
  
    // listen
    const port = process.env.PORT || 3000;
    server = app.listen(port, () => {
      console.log(`app running on port ${port} ....`);
    });

  })
  .catch((err) => {
    console.log('Error connecting to DB: ', err);
  });
    


process.on('unhandledRejection', err => {
  console.log('Unhandled rejection! Shutting down.....');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  })
});


