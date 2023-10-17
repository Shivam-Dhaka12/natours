const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const tourModel = require(`${__dirname}/models/tourModel`);
const userModel = require(`${__dirname}/models/userModel`);
const reviewModel = require(`${__dirname}/models/reviewModel`);

dotenv.config({ path: './config.env' });

// DB connection using mongoose
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB conncection successful!'));

//Reading file data
const tour_data = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours.json`, 'utf-8'));
const user_data = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/users.json`, 'utf-8'));
const review_data = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/reviews.json`, 'utf-8'));

//inserting data
const insertData = async () => {
  try {
    await tourModel.create(tour_data);
    await reviewModel.create(review_data);
    await userModel.create(user_data, {validateBeforeSave: false});
    console.log('Data inserted successfully:)');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//deleting data
const deleteData = async () => {
  try {
    await tourModel.deleteMany();
    await userModel.deleteMany();
    await reviewModel.deleteMany();
    console.log('Data deleted successfully:)');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//Reading arguments
if (process.argv[2] === '--insert') {
  insertData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  console.log("Please enter a valid option from: --insert | --delete");
  process.exit();
}
