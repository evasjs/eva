/**
 * @Author: eason
 * @Date:   2017-05-18T23:37:50+08:00
* @Last modified by:   eason
* @Last modified time: 2017-05-19T15:24:29+08:00
 */
import fs from 'fs';

import warning from 'warning';
import invariant from 'invariant';

import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import multipart from 'connect-multiparty';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

export function mapObject(object, wrapper) {
  const t = {};

  Object.keys(object).forEach((name) => {
    t[name] = wrapper(name, object[name]);
  });

  return t;
}

export function createMethod(methodObject, namespace, name, extraMethodObject) {
  const [ns, handlerName, userUseColon] = name.split(':');
  let rNs = namespace;
  let rHn = handlerName;

  // current namespace method
  if (handlerName === undefined) {
    rHn = name;
  } else {
    // :getSome === global:getSome
    rNs = ns === '' ? 'global' : ns;
    rHn = userUseColon.length ? `${rHn}:${userUseColon.join(':')}` : rHn;
  }

  if (extraMethodObject) {
    if (!methodObject[rNs][rHn]) {
      invariant(
        extraMethodObject[rNs][rHn],
        `Check whether handler ${rHn} has already register in ${rNs}`,
      );

      warning(
        methodObject[rNs][rHn] || !extraMethodObject[rNs][rHn],
        `You had better create method ${rHn} as handler in ${rNs}`,
      );
    } else {
      warning(
        methodObject[rNs][rHn],
        `You had better create handler ${rHn} in ${rNs}`,
      );
    }

    return methodObject[rNs][rHn] || extraMethodObject[rNs][rHn];
  }

  invariant(
    methodObject[rNs][rHn],
    `Check whether method ${rHn} has already register in ${rNs}`,
  );

  return methodObject[rNs][rHn]
    ? methodObject[rNs][rHn]
    : (req, res, next) => next();
}

// mongodb://localhost/database
// mongodb://localhost:27017/database
// mongodb://user:pass@localhost:27017/database
export function createDbConf({
  NAME,
  ENGINE,
  HOST = 'localhost',
  PORT = 27017,
  USERNAME = null,
  PASSWORD = null,
}) {
  if (USERNAME && PASSWORD) {
    return `${ENGINE}://${USERNAME}:${PASSWORD}@${HOST}:${PORT}/${NAME}`;
  }
  return `${ENGINE}://${HOST}:${PORT}/${NAME}`;
}

export function connectMongodb(uri, env) {
  const mongoose = require('mongoose'); // eslint-disable-line
  if (env !== 'production') {
    mongoose.set('debug', true);
  }

  mongoose.connect(uri, (err) => {
    /* eslint-disable */
    if (err) {
      console.log('\nError: MongoDB Connect Error. Maybe you donot start mongo server.');
      console.log('\t%s\n', err);
      process.exit();
    } else {
      console.log('Info: MongoDB Connect Successfully.');
    }
    /* eslint-enable */
  });
  return mongoose;
}

export function createInstance(env, log) {
  const instance = express();
  // 1 LOG
  if (env === 'development') {
    instance.set('showStackErr', true);
    instance.use(logger(':method :url :status :response-time[digits]'));
    instance.locals.pretty = true;
  } else {
    instance.use(logger('combined', {
      stream: fs.createWriteStream(log, { flags: 'a' }),
    }));
  }

  // 2 Common Middlewares
  instance.use(helmet());
  instance.use(cors());
  instance.use(bodyParser.json());
  instance.use(bodyParser.urlencoded({ extended: true }));
  instance.use(multipart());
  instance.use(compression());

  return instance;
}
