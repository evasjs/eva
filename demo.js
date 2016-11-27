/**
* @Author: eason
* @Date:   2016-11-27T18:23:42+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2016-11-27T21:46:21+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

const Eva = require('./eva');

const app = new Eva();


app.model('article', {
  name: String,
  value: Number
})

app.model('user', {
  name: String,
  age: Number,
});

app.run();
