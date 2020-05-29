var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var request = require('request');
var cors = require('cors');
var parse5 = require('parse5');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const NYAA_SEARCH_URL = "https://nyaa.si/?f=0&c=0_0&q=";
const NYAA_DESCENT_ORDER = "&s=size&o=desc";

const AnimeAPI = (req, res) => {
  let content = req.params.content.split("_").reduce((acc, cur) => acc + "+" + cur);
  const targetURL = NYAA_SEARCH_URL + content + NYAA_DESCENT_ORDER;
  console.log(targetURL);
  request(targetURL, function (err, response, body) {
    let parsed = parse5.parse(body);
    let tbody;
    try {
       tbody = parsed.childNodes[1].childNodes[2].childNodes[5].childNodes[3].childNodes[1].childNodes[3].childNodes
    }catch (e) {
      tbody = parsed.childNodes[1].childNodes[2].childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes;
    }
    let resultList = [];
    for (let each of tbody) {
      let type = '';
      let name = '';
      let magnet = '';
      let size = '';
      let date = '';
      let seeders = '';
      let leechers = '';
      let completes = '';

      if (each.nodeName === "tr") {
        type = each.childNodes[1].childNodes[1].attrs[1].value.split(' - ')[0];
        let nameNode = each.childNodes[3].childNodes;
        (nameNode[3]) ? name = nameNode[3].childNodes[0].value : name = nameNode[1].childNodes[0].value;
        magnet = each.childNodes[5].childNodes[3].attrs[0].value.split('&dn=')[0];
        size = each.childNodes[7].childNodes[0].value;
        date = each.childNodes[9].childNodes[0].value;
        seeders = each.childNodes[11].childNodes[0].value;
        leechers = each.childNodes[13].childNodes[0].value;
        completes = each.childNodes[15].childNodes[0].value;
        let eachJSON = {
            "type": type,
            "name": name,
            "magnet": magnet,
            "size": size,
            "date": date,
            "seeders": seeders,
            "leechers": leechers,
            "completes": completes
        };
        resultList = [...resultList, eachJSON];
      }
    }
    res.send(resultList);
  });
};


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/anime/:content', AnimeAPI);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
