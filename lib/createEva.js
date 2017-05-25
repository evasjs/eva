'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.default = createEva;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _express = require('express');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* @Author: eason
* @Date:   2017-05-18T15:37:15+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2017-05-25T19:48:54+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/
var DEFAULT_SERVER = {
  HOST: 'localhost',
  PORT: process.env.PORT || 8000
};

var DEFAULT_DB = {
  DEFAULT: {
    NAME: 'EVA_DEFAULT',
    ENGINE: 'mongodb',
    HOST: 'localhost',
    PORT: '27017'
  },
  PRODUCT: {
    NAME: 'EVA_PRODUCT',
    ENGINE: 'mongodb',
    USERNAME: 'mogo',
    PASSWORD: 'mongo',
    HOST: 'localhost',
    PORT: '27017'
  }
};

function createEva() {
  //
  return function eva() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$context = _ref.context,
        context = _ref$context === undefined ? process.cwd() : _ref$context,
        _ref$instance = _ref.instance,
        instance = _ref$instance === undefined ? null : _ref$instance,
        _ref$db = _ref.db,
        db = _ref$db === undefined ? DEFAULT_DB : _ref$db,
        _ref$server = _ref.server,
        server = _ref$server === undefined ? DEFAULT_SERVER : _ref$server;

    // Generate server instance and db instance
    var _init = init(instance),
        _instance = _init.instance,
        mongoose = _init.mongoose;

    var app = {
      // properties
      _namespaces: [],
      _models: {},
      _middlewares: {
        global: {}
      },
      _handlers: {},
      _routes: {},
      // utils
      _utils: {},

      // methods
      registerNamespace: registerNamespace,
      model: model,
      middleware: middleware,
      handler: handler,
      route: route,
      register: register,
      plugin: plugin,
      util: util,
      start: start,

      // express instance
      _instance: _instance
    };

    return app;

    function init(_appInstance) {
      var MODE = process.env.NODE_ENV || 'development';
      var LOGFILE = _path2.default.join(context, '.app.log');

      var appInstance = _appInstance || (0, _utils.createInstance)(MODE, LOGFILE);

      var appMongoose = (0, _utils.connectMongodb)((0, _utils.createDbConf)(db[MODE] || db.DEFAULT || db), MODE);

      return { instance: appInstance, mongoose: appMongoose };
    }

    function registerNamespace(ns) {
      (0, _invariant2.default)(ns, 'app.registerNamespace: namespace should be defined !');

      (0, _invariant2.default)(!app._namespaces.includes(ns) && ns !== 'global', 'app.namespace: registerNamespace(' + ns + ') should be unique.');

      app._namespaces.push(ns);

      return app;
    }

    function model(namespace, ms) {
      (0, _invariant2.default)(ms, 'app.model: models should be defined in ' + namespace);

      var schema = ms.schema,
          options = ms.options,
          virtuals = ms.virtuals,
          methods = ms.methods,
          statics = ms.statics,
          pre = ms.pre,
          post = ms.post;

      var vModels = app._models;

      (0, _invariant2.default)(!vModels[namespace], 'app.model: model ' + namespace + ' should register only once.');

      var vUtils = app._utils;

      var mongooseSchema = new mongoose.Schema(schema, options);
      if (methods) {
        mongooseSchema.methods = (0, _utils.mapObject)(methods, function (name, em) {
          return function method() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            em.apply(this, [vModels, vUtils].concat(args));
          };
        });
      }
      if (statics) {
        mongooseSchema.statics = (0, _utils.mapObject)(statics, function (name, em) {
          return function method() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              args[_key2] = arguments[_key2];
            }

            em.apply(this, [vModels, vUtils].concat(args));
          };
        });
      }

      if (virtuals) {
        (0, _utils.mapObject)(virtuals, function (name, em) {
          return mongooseSchema.virtual(name).get(function () {
            return em(vUtils);
          });
        });
      }

      if (pre) {
        (0, _utils.mapObject)(pre, function (name, em) {
          return mongooseSchema.pre(name, function preName(next) {
            em.apply(this, [vModels, vUtils, next]);
          });
        });
      }

      if (post) {
        (0, _utils.mapObject)(post, function (name, em) {
          return mongooseSchema.post(name, function preName(next) {
            em.apply(this, [vModels, vUtils, next]);
          });
        });
      }

      vModels[namespace] = mongoose.model(namespace, mongooseSchema);

      // link
      return app;
    }

    function middleware(namespace, middlewares) {
      (0, _invariant2.default)(middlewares, 'app.middleware: middlewares should be defined in ' + namespace);

      var vMiddlewares = app._middlewares;
      var vModels = app._models;
      var vUtils = app._utils;

      vMiddlewares[namespace] = (0, _utils.mapObject)(middlewares, function (name, em) {
        return function (req, res, next) {
          return em(vModels, { req: req, res: res, next: next }, vUtils);
        };
      });

      return app;
    }

    function handler(namespace, handlers) {
      (0, _invariant2.default)(handlers, 'app.handler: handlers should be defined in ' + namespace);

      var vHandlers = app._handlers;
      var vModels = app._models;
      var vUtils = app._utils;

      vHandlers[namespace] = (0, _utils.mapObject)(handlers, function (name, em) {
        return function (req, res, next) {
          return em(vModels, { req: req, res: res, next: next }, vUtils);
        };
      });

      return app;
    }

    function route(namespace, routes) {
      (0, _invariant2.default)(routes, 'app.route: routes should be defined in ' + namespace);

      app._routes[namespace] = routes;

      return app;
    }

    function register(oneApp) {
      var namespace = oneApp.namespace,
          models = oneApp.models,
          routes = oneApp.routes,
          middlewares = oneApp.middlewares,
          handlers = oneApp.handlers;


      registerNamespace(namespace);
      if (middlewares) middleware(namespace, middlewares);
      if (handlers) handler(namespace, handlers);
      if (models) model(namespace, models);
      if (routes) route(namespace, routes);

      return app;
    }

    function renderRoutes(namespace, routes) {
      var vMiddlewares = app._middlewares;
      var vHandlers = app._handlers;

      var t = (0, _utils.mapObject)(
      // { path: {} }
      routes, function (_, methodObject) {
        // different middlewares + handler
        // '/user': 'handle_user'
        if (typeof methodObject === 'string') {
          return [(0, _utils.createMethod)(vHandlers, namespace, methodObject, vMiddlewares)];
        } else if (Array.isArray(methodObject)) {
          // '/user': ['handle_user']
          var _ref2 = [methodObject.slice(0, -1)].concat((0, _toConsumableArray3.default)(methodObject.slice(-1))),
              middlewares = _ref2[0],
              endHandler = _ref2[1];

          return [].concat((0, _toConsumableArray3.default)(middlewares.map(function (m) {
            return (0, _utils.createMethod)(vMiddlewares, namespace, m);
          })), [(0, _utils.createMethod)(vHandlers, namespace, endHandler, vMiddlewares)]);
        } else {
          // { get: [], post: [] }
          return (0, _utils.mapObject)(methodObject, function (_, methodMHs) {
            // eslint-disable-line
            var _ref3 = [methodMHs.slice(0, -1)].concat((0, _toConsumableArray3.default)(methodMHs.slice(-1))),
                middlewares = _ref3[0],
                endHandler = _ref3[1];

            return [].concat((0, _toConsumableArray3.default)(middlewares.map(function (m) {
              return (0, _utils.createMethod)(vMiddlewares, namespace, m);
            })), [(0, _utils.createMethod)(vHandlers, namespace, endHandler, vMiddlewares)]);
          });
        }
      });

      var router = new _express.Router();
      (0, _keys2.default)(t).forEach(function (rpath) {
        var methods = t[rpath];

        if (Array.isArray(t[rpath])) {
          // '/user': 'list_user' // @Support only get method
          // '/user': ['list_user'] // @Support only get method
          return router.get.apply(router, [rpath].concat((0, _toConsumableArray3.default)(t[rpath])));
        }

        // @TODO
        // '/user': { get: [], post: [], ... },
        (0, _keys2.default)(methods).forEach(function (name) {
          return router[name].apply(router, [rpath].concat((0, _toConsumableArray3.default)(methods[name])));
        });
      });

      return router;
    }

    function start() {
      for (var namespace in app._routes) {
        if (Object.prototype.hasOwnProperty.call(app._routes, namespace)) {
          var nsRoutes = renderRoutes(namespace, app._routes[namespace]);

          // for (const oneRoute of nsRoutes) {
          //   instance.use(oneRoute);
          // }

          _instance.use(nsRoutes);
        }
      }

      _instance.listen(server.PORT, server.HOST || 'localhost', function (err) {
        /* eslint-disable */
        if (err) {
          console.log(err);
        } else {
          console.log('Server start at port: ' + server.PORT);
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
      var vUtils = app._utils;

      app._utils = (0, _extends3.default)({}, vUtils, utils);

      return app;
    }
  };
}
module.exports = exports['default'];