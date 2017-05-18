/**
* @Author: eason
* @Date:   2016-11-27T18:23:42+08:00
* @Email:  uniquecolesmith@gmail.com
 * @Last modified by:   eason
 * @Last modified time: 2017-05-19T01:33:22+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

const Eva = require('./src');

const app = Eva();

app.register({
  namespace: 'Test',
  models: {
    schema: {
      name: String,
    },
    virtuals: {
      'hi'() {
        return `hi, ${this.name}`;
      },
    },
    statics: {
      'say/hi'() {
        return 'hihibyebye!';
      },
      'list/all'(models, cb, ...args) {
        console.log('xxy: ', models, cb, args);
        this
          .find({})
          .exec(cb);
      },
    },
    methods: {
    },
  },
  routes: {
    '/': {
      // all: [],
      get: ['hello/world'],
      post: ['hello/world/post'],
      // post: [],
      // put: [],
    },
    '/test': {
      get: ['log/time', 'test'],
    },
  },
  middlewares: {
    'log/time'(models, { next, req }) {
      req.edate = new Date();
      next();
    },
  },
  handlers: {
    'hello/world'({ Test }, { res }) {
      Test['list/all']((err, rs) => {
        res.json({
          text: `hello, world! ${Test['say/hi']()} !`,
          rs,
        });
      });
    },
    'test'(models, { req, res }) {
      res.json({ text: `test: ${req.edate}` });
    },
    'hello/world/post'({ Test }, { req, res }) {
      const { name } = req.body;
      new Test({ name }).save((err, o) => res.json({ in: req.body, out: o }));
    },
  },
});

app.start();
