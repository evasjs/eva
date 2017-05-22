/**
* @Author: eason
* @Date:   2017-05-18T15:37:15+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2017-05-22T18:48:05+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/
import path from 'path';
import invariant from 'invariant';

import { Router } from 'express';

import { mapObject, createMethod, createDbConf, connectMongodb, createInstance } from './utils';

const DEFAULT_SERVER = {
  HOST: 'localhost',
  PORT: process.env.PORT || 8000,
};

const DEFAULT_DB = {
  DEFAULT: {
    NAME: 'EVA_DEFAULT',
    ENGINE: 'mongodb',
    HOST: 'localhost',
    PORT: '27017',
  },
  PRODUCT: {
    NAME: 'EVA_PRODUCT',
    ENGINE: 'mongodb',
    USERNAME: 'mogo',
    PASSWORD: 'mongo',
    HOST: 'localhost',
    PORT: '27017',
  },
};

export default function createEva() {
  //
  return function eva({
    context = process.cwd(),
    instance = null,
    db = DEFAULT_DB,
    server = DEFAULT_SERVER,
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
      // utils
      _utils: {},

      // methods
      registerNamespace,
      model,
      middleware,
      handler,
      route,
      register,
      plugin,
      util,
      start,

      // express instance
      _instance,
    };

    const { instance: _instance, mongoose } = init(instance);

    return app;

    function init(_appInstance) {
      const MODE = process.env.NODE_ENV || 'development';
      const LOGFILE = path.join(context, '.app.log');

      const appInstance = _appInstance || createInstance(MODE, LOGFILE);

      const appMongoose = connectMongodb(
        createDbConf(db[MODE] || db.DEFAULT || db),
        MODE,
      );

      return { instance: appInstance, mongoose: appMongoose };
    }

    function registerNamespace(ns) {
      invariant(ns, 'app.registerNamespace: namespace should be defined !');

      invariant(
        !app._namespaces.includes(ns) && ns !== 'global',
        `app.namespace: registerNamespace(${ns}) should be unique.`,
      );

      app._namespaces.push(ns);

      return app;
    }

    function model(namespace, ms) {
      invariant(ms, `app.model: models should be defined in ${namespace}`);

      const { schema, options, virtuals, methods, statics, pre, post } = ms;
      const vModels = app._models;

      invariant(!vModels[namespace], `app.model: model ${namespace} should register only once.`);

      const vUtils = app._utils;

      const mongooseSchema = new mongoose.Schema(schema, options);
      if (methods) {
        mongooseSchema.methods = mapObject(methods, (name, em) => function method(...args) {
          em.apply(this, [vModels, vUtils, ...args]);
        });
      }
      if (statics) {
        mongooseSchema.statics = mapObject(statics, (name, em) => function method(...args) {
          em.apply(this, [vModels, vUtils, ...args]);
        });
      }

      if (virtuals) {
        mapObject(
          virtuals,
          (name, em) => mongooseSchema.virtual(name).get(() => em(vUtils)),
        );
      }

      if (pre) {
        mapObject(
          pre,
          (name, em) => mongooseSchema.pre(name, next => em(vModels, vUtils, next)),
        );
      }

      if (post) {
        mapObject(
          post,
          (name, em) => mongooseSchema.post(name, next => em(vModels, vUtils, next)),
        );
      }

      vModels[namespace] = mongoose.model(namespace, mongooseSchema);

      // link
      return app;
    }

    function middleware(namespace, middlewares) {
      invariant(middlewares, `app.middleware: middlewares should be defined in ${namespace}`);

      const vMiddlewares = app._middlewares;
      const vModels = app._models;
      const vUtils = app._utils;

      vMiddlewares[namespace] = mapObject(
        middlewares,
        (name, em) => (req, res, next) => em(vModels, { req, res, next }, vUtils),
      );

      return app;
    }

    function handler(namespace, handlers) {
      invariant(handlers, `app.handler: handlers should be defined in ${namespace}`);

      const vHandlers = app._handlers;
      const vModels = app._models;
      const vUtils = app._utils;

      vHandlers[namespace] = mapObject(
        handlers,
        (name, em) => (req, res, next) => em(vModels, { req, res, next }, vUtils),
      );

      return app;
    }

    function route(namespace, routes) {
      invariant(routes, `app.route: routes should be defined in ${namespace}`);

      app._routes[namespace] = routes;

      return app;
    }

    function register(oneApp) {
      const { namespace, models, routes, middlewares, handlers } = oneApp;

      registerNamespace(namespace);
      if (middlewares) middleware(namespace, middlewares);
      if (handlers) handler(namespace, handlers);
      if (models) model(namespace, models);
      if (routes) route(namespace, routes);

      return app;
    }

    function renderRoutes(namespace, routes) {
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
                createMethod(vHandlers, namespace, endHandler, vMiddlewares),
              ];
            },
          );
        },
      );

      const router = new Router();
      Object.keys(t).forEach((rpath) => {
        const methods = t[rpath];

        Object.keys(methods)
          .forEach(name => router[name](rpath, ...methods[name]));
      });

      return router;
    }

    function start() {
      for (const namespace in app._routes) {
        if (Object.prototype.hasOwnProperty.call(app._routes, namespace)) {
          const nsRoutes = renderRoutes(namespace, app._routes[namespace]);

          // for (const oneRoute of nsRoutes) {
          //   instance.use(oneRoute);
          // }

          _instance.use(nsRoutes);
        }
      }

      _instance.listen(server.PORT, server.HOST || 'localhost', (err) => {
        /* eslint-disable */
        if (err) {
          console.log(err);
        } else {
          console.log(`Server start at port: ${server.PORT}`);
        }
        /* eslint-enable */
      });

      return _instance;
    }

    function plugin(application) {
      register(application);
      return app;
    }

    function util(utils) {
      const vUtils = app._utils;

      app._utils = { ...vUtils, ...utils };

      return app;
    }
  };
}
