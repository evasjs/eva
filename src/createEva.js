/**
* @Author: eason
* @Date:   2017-05-18T15:37:15+08:00
* @Email:  uniquecolesmith@gmail.com
 * @Last modified by:   eason
 * @Last modified time: 2017-05-19T01:36:51+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/
import fs from 'fs';
import path from 'path';
import invariant from 'invariant';

import mongoose from 'mongoose';

import express, { Router } from 'express';

import logger from 'morgan';
import bodyParser from 'body-parser';
import multipart from 'connect-multiparty';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { mapObject, mapFnObject, createMethod } from './utils';

const DEFAULT_DB_URI = 'mongodb://localhost/eva_db';
const DEFAULT_PORT = process.env.PORT || 8000;

export default function createEva() {
  const instance = express();

  return function eva({
    context = process.cwd(),
    db = DEFAULT_DB_URI,
    port = DEFAULT_PORT,
  } = {}) {
    const app = {
      // properties
      _namespaces: [],
      _models: {},
      _middlewares: {
        global: {},
      },
      _handlers: {},
      _routes: {},

      // methods
      registerNamespace,
      model,
      middleware,
      handler,
      route,
      register,
      plugin,
      start,

      // express instance
      instance,
    };

    init();

    return app;

    function init() {
      const MODE = process.env.NODE_ENV || 'development';
      const LOGFILE = path.join(context, '.app.log');

      // 1 LOG
      if (MODE === 'development') {
        instance.set('showStackErr', true);
        instance.use(logger(':method :url :status :response-time[digits]'));
        instance.locals.pretty = true;
        mongoose.set('debug', true);
      } else {
        instance.use(logger('combined', {
          stream: fs.createWriteStream(LOGFILE, { flags: 'a' }),
        }));
      }

      // 2 Database
      mongoose.connect(db, (err) => {
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

      // 3 Common Middlewares
      instance.use(helmet());
      instance.use(cors());
      instance.use(bodyParser.json());
      instance.use(bodyParser.urlencoded({ extended: true }));
      instance.use(multipart());
      instance.use(compression());
    }

    function registerNamespace(ns) {
      invariant(ns, 'app.registerNamespace: namespace should be defined !');

      invariant(
        !app._namespaces.includes(ns),
        `app.namespace: registerNamespace(${ns}) should be unique.`,
      );

      app._namespaces.push(ns);
    }

    function model(namespace, ms) {
      const { schema, options, virtuals, methods, statics } = ms;
      const vModels = app._models;

      const realSchema = new mongoose.Schema(schema, options);
      realSchema.methods = mapFnObject(methods, (name, em) => function method(...args) {
        em.apply(this, [vModels, ...args]);
      });
      realSchema.statics = mapFnObject(statics, (name, em) => function method(...args) {
        em.apply(this, [vModels, ...args]);
      });
      mapFnObject(virtuals, (name, em) => realSchema.virtual(name).get(em));

      vModels[namespace] = mongoose.model(namespace, realSchema);

      // link
      return model;
    }

    function middleware(namespace, middlewares) {
      const vMiddlewares = app._middlewares;
      const vModels = app._models;

      vMiddlewares[namespace] = mapFnObject(
        middlewares,
        (name, em) => (req, res, next) => em(vModels, { req, res, next }),
      );

      return middleware;
    }

    function handler(namespace, handlers) {
      const vHandlers = app._handlers;
      const vModels = app._models;

      vHandlers[namespace] = mapFnObject(
        handlers,
        (name, em) => (req, res, next) => em(vModels, { req, res, next }),
      );

      return middleware;
    }

    function route(namespace, routes) {
      const vMiddlewares = app._middlewares;
      const vHandlers = app._handlers;

      const t = mapObject(
        // { path: {} }
        routes,
        (_, methodObject) => {
          // { get: [], post: [] }
          return mapObject(
            methodObject,
            (_, methodMHs) => { // eslint-disable-line
              const [middlewares, endHandler] = [methodMHs.slice(0, -1), ...methodMHs.slice(-1)];
              return [
                ...middlewares.map(m => createMethod(vMiddlewares, namespace, m)),
                createMethod(vHandlers, namespace, endHandler),
              ];
            },
          );
        },
      );

      const router = new Router();
      Object.keys(t).forEach((rpath) => {
        const methods = t[rpath];
        // const oneRouter = router.route(rpath);

        // console.log('X: ', app._handlers.Article['hello/world'].toString());

        Object.keys(methods)
          .forEach(name => router[name](rpath, ...methods[name]));
      });

      app._routes[namespace] = router;

      return route;
    }

    function register(oneApp) {
      const { namespace, models, routes, middlewares, handlers } = oneApp;

      registerNamespace(namespace);
      middleware(namespace, middlewares);
      handler(namespace, handlers);
      model(namespace, models);
      route(namespace, routes);
    }

    function start() {
      for (const namespace in app._routes) {
        if (Object.prototype.hasOwnProperty.call(app._routes, namespace)) {
          const nsRoutes = app._routes[namespace];

          // for (const oneRoute of nsRoutes) {
          //   instance.use(oneRoute);
          // }

          instance.use(nsRoutes);
        }
      }

      instance.listen(port, '127.0.0.1', (err) => {
        /* eslint-disable */
        if (err) {
          console.log(err);
        } else {
          console.log(`Server start at port: ${port}`);
        }
        /* eslint-enable */
      });

      return instance;
    }

    function plugin(hook) {
      return hook(app);
    }
  };
}
