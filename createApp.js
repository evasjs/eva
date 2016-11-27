/**
* @Author: eason
* @Date:   2016-11-27T17:19:44+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2016-11-27T18:44:08+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

const fs = require('fs');
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');

const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const cors = require('cors');
const helmet = require('helmet');

// const createModel = require('./createModel');
// const createController = require('./createController');
// const createRoute = require('./createRoute');

const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';
const LOGFILE = process.env.LOG || path.join(__dirname, '.access.log');
const DBURL = process.env.DBURL || 'mongodb://localhost/eva_rest_api';


module.exports = function createApp (appName) {
  const app = express();

  // locals config
  // app.locals = {};

  // 1 LOG
  if ('development' === ENV) {
    app.set('showStackErr', true);
    app.use(logger(':method :url :status :response-time[digits]'));
    app.locals.pretty = true;
    mongoose.set('debug', true);
  } else {
    app.use(logger('combined', {
      stream: fs.createWriteStream(LOGFILE, {flags: 'a'})
    }));
  }

  // 2 Database
  mongoose.connect(DBURL, (err, db) => {
    if (err) {
      console.log('\nError: MongoDB Connect Error. Maybe you donot start mongo server.');
      console.log('\t%s\n', err);
      process.exit();
    } else {
      console.log('Info: MongoDB Connect Successfully.');
    }
  });

  // 3 Common Middlewares
  app.use(helmet());
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multipart());

  // 4 Route
  // const model = createModel(appName, appStructureDefinition);
  // const controller = createController(model);
  // const route = createRoute(appName, controller);
  // app.use(`/api/v1/${appName}`, createRoute(
  //   appName,
  //   createController(
  //     createModel(appName, appStructureDefinition)
  //   )
  // ));

  // App Instance
  return app;
}
