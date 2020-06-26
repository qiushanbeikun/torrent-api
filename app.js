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

  request(targetURL, function (err, response, body) {
    let parsed = parse5.parse(body);
    let tbody;
    try {
      tbody = parsed.childNodes[1].childNodes[2].childNodes[5].childNodes[3].childNodes[1].childNodes[3].childNodes
    } catch (e) {
      try {
        tbody = parsed.childNodes[1].childNodes[2].childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes;
      } catch (e) {
        // do nothing
      }
    }

    try {
      let animeResultList = [];
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
          animeResultList = [...animeResultList, eachJSON];
        }
      }
      res.send(animeResultList);
    }catch (e) {
      res.send("There is no result based on your search.");
    }


  });

};

const SUKEBEI_SEARCH_URL = "https://sukebei.nyaa.si/?f=0&c=0_0&q=";
const SUKEBEI_DESCENT_ORDER = "&s=seeders&o=desc";

const PornAPI = (req, res) => {
  let content = req.params.content.split("_").reduce((acc, cur) => acc + "+" + cur);
  const targetURL = SUKEBEI_SEARCH_URL + content + SUKEBEI_DESCENT_ORDER;
  request(targetURL, function (err, response, body) {
    let parsed = parse5.parse(body);
    let tbody;
    try {
      tbody = parsed.childNodes[1].childNodes[2].childNodes[5].childNodes[5].childNodes[1].childNodes[3].childNodes;
    } catch (e) {
      // try {
      //   tbody = parsed.childNodes[1].childNodes[2].childNodes[5].childNodes[1].childNodes[1].childNodes[3].childNodes;
      // }catch (e) {
      //   // do nothing
      // }
    }
    try {
      let pornResultList = [];
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
          pornResultList = [...pornResultList, eachJSON];
        }
      }
      res.send(pornResultList);
    }catch (e) {
      res.send("There is no result based on your search.");
    }
  })
};

const testAPI = (req, res) => {
  const targetURL = 'https://api.bilibili.com/x/v2/reply?pn=1&type=1&oid=926122893'; // B站的api获取所有的评论 返回一个json file
  request(targetURL, function (err, response, body) {
    let allReplies = JSON.parse(body).data.replies; // 获取所有的评论作为一个array
    const numberOfReplies = allReplies.length; // 所有评论的总数
    const randomFloor = Math.floor(Math.random() * numberOfReplies); // 以评论数为上界产生一个随机数
    const luckyUser = allReplies[randomFloor-1].member.uname; // 谁是这个幸运的人
    const userMid = allReplies[randomFloor-1].member.mid; // 他的uid
    const message = allReplies[randomFloor-1].content.message; // 他的评论内容
    const result = `${luckyUser}_${userMid}_message:${message}`; // 以string的方式送回
    res.send(result);
  })
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/anime/:content', AnimeAPI);
app.use('/porn/:content', PornAPI);
app.use('/test', testAPI);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
