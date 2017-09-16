'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

exports.mapObject = mapObject;
exports.createMethod = createMethod;
exports.createDbConf = createDbConf;
exports.connectMongodb = connectMongodb;
exports.createInstance = createInstance;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _connectMultiparty = require('connect-multiparty');

var _connectMultiparty2 = _interopRequireDefault(_connectMultiparty);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _helmet = require('helmet');

var _helmet2 = _interopRequireDefault(_helmet);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @Author: eason
 * @Date:   2017-05-18T23:37:50+08:00
* @Last modified by:   eason
* @Last modified time: 2017-05-19T18:01:37+08:00
 */
function mapObject(object, wrapper) {
  var t = {};

  (0, _keys2.default)(object).forEach(function (name) {
    t[name] = wrapper(name, object[name]);
  });

  return t;
}

function createMethod(methodObject, namespace, name, extraMethodObject) {
  var _name$split = name.split(':'),
      _name$split2 = (0, _slicedToArray3.default)(_name$split, 3),
      ns = _name$split2[0],
      handlerName = _name$split2[1],
      userUseColon = _name$split2[2];

  var rNs = namespace;
  var rHn = handlerName;

  // current namespace method
  if (handlerName === undefined) {
    rHn = name;
  } else {
    // :getSome === global:getSome
    rNs = ns === '' ? 'global' : ns;
    rHn = userUseColon && userUseColon.length ? rHn + ':' + userUseColon.join(':') : rHn;
  }

  if (extraMethodObject) {
    if (!methodObject[rNs] || !methodObject[rNs][rHn]) {
      (0, _invariant2.default)(extraMethodObject[rNs][rHn], 'Check whether handler ' + rHn + ' has already register in ' + rNs);

      (0, _warning2.default)(methodObject[rNs] && methodObject[rNs][rHn] || !extraMethodObject[rNs][rHn], 'You had better create method ' + rHn + ' as handler in ' + rNs);

      return extraMethodObject[rNs][rHn];
    } else {
      (0, _warning2.default)(methodObject[rNs][rHn], 'You had better create handler ' + rHn + ' in ' + rNs);
      return methodObject[rNs][rHn] || extraMethodObject[rNs][rHn];
    }
  }

  (0, _invariant2.default)(methodObject[rNs][rHn], 'Check whether method ' + rHn + ' has already register in ' + rNs);

  return methodObject[rNs][rHn] ? methodObject[rNs][rHn] : function (req, res, next) {
    return next();
  };
}

// mongodb://localhost/database
// mongodb://localhost:27017/database
// mongodb://user:pass@localhost:27017/database
function createDbConf(_ref) {
  var NAME = _ref.NAME,
      ENGINE = _ref.ENGINE,
      _ref$HOST = _ref.HOST,
      HOST = _ref$HOST === undefined ? 'localhost' : _ref$HOST,
      _ref$PORT = _ref.PORT,
      PORT = _ref$PORT === undefined ? 27017 : _ref$PORT,
      _ref$USERNAME = _ref.USERNAME,
      USERNAME = _ref$USERNAME === undefined ? null : _ref$USERNAME,
      _ref$PASSWORD = _ref.PASSWORD,
      PASSWORD = _ref$PASSWORD === undefined ? null : _ref$PASSWORD;

  if (USERNAME && PASSWORD) {
    return ENGINE + '://' + USERNAME + ':' + PASSWORD + '@' + HOST + ':' + PORT + '/' + NAME;
  }
  return ENGINE + '://' + HOST + ':' + PORT + '/' + NAME;
}

function connectMongodb(uri, env) {
  var mongoose = require('mongoose'); // eslint-disable-line
  if (env !== 'production') {
    mongoose.set('debug', true);
  }

  mongoose.connect(uri, function (err) {
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

function createInstance(env, log) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var instance = (0, _express2.default)();
  // 1 LOG
  if (env === 'development') {
    instance.set('showStackErr', true);
    instance.use((0, _morgan2.default)(':method :url :status :response-time[digits]'));
    instance.locals.pretty = true;
  } else {
    instance.use((0, _morgan2.default)('combined', {
      stream: _fs2.default.createWriteStream(log, { flags: 'a' })
    }));
  }

  // 2 Common Middlewares
  instance.use((0, _helmet2.default)(options.helmetOptions));
  instance.use((0, _cors2.default)(options.corsOptions));
  instance.use(_bodyParser2.default.json());
  instance.use(_bodyParser2.default.urlencoded({ extended: true }));
  instance.use((0, _connectMultiparty2.default)(options.multipartOptions));
  instance.use((0, _compression2.default)(options.compressionOptions));

  return instance;
}