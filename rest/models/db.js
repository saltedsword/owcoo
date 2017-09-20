/*
* @ author sessionboy 
* @ github https://github.com/sessionboy
* @ website http://sinn.boyagirl.com
* @ use 数据库连接
*/ 
import mongoose from 'mongoose';
import config from '../../config/config';
import Promise from 'bluebird';
mongoose.Promise = Promise; // 替换原有的mpromise

const dbConfig = config[process.env.NODE_ENV||'development'];
mongoose.set('debug', false);
mongoose.connect(dbConfig.mongo.uri,{useMongoClient:true});
// 连接成功 
mongoose.connection.on('connected', function() {
  console.log('Mongoose connection open to ' + dbConfig.mongo.uri);
});

// 连接失败
mongoose.connection.on('error', function(err) {
  console.log('Mongoose connection error: ' + err);
});

// 断开连接
mongoose.connection.on('disconnected', function() {
  console.log('Mongoose connection disconnected');
});

