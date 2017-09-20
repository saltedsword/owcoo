/*
* @ author sessionboy 
* @ github https://github.com/sessionboy
* @ website http://sinn.boyagirl.com
* @ use 统一try catch处理中间件
* @ 用于捕获内部错误，输出日志信息
*/ 
const tracer = require('tracer');
const logger = tracer.colorConsole({
  level: 'error',
  format: '{{timestamp}} <{{title}}> {{file}}(#{{line}}): {{message}}',
  file: 'error.log',
  path: __dirname
});

export default async (ctx, next) => {
  try{
    await next();
  } catch (err){
    if (!err) {
      return ctx.errorMsg('未知错误!');
    } 
    if (typeof(err)=='string') {
      return ctx.errorMsg(err);
    }
    logger.error(err.stack);
    ctx.errorMsg('服务器错误!', 500);
  }
}



