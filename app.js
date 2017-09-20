'use strict';
import Koa from 'koa';
const app = new Koa();
import onerror from 'koa-onerror';
import bodyparser from 'koa-bodyparser';
import logger from 'koa-logger';
import db from './rest/models/db';
import { backRouter, frontRouter } from './rest/routes/index';
import * as middlewares from './rest/middlewares/';

/*
* @ 日志处理
*/
onerror(app);
app.use(logger());

/*
* @ 请求处理时间
*/
// app.use(async (ctx, next) => {
//   const start = new Date();
//   await next();
//   const ms = new Date() - start;
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
// });

/*
* @ author gaoshanheng 
* @ 同一错误处理 和 同一响应中间件
*/ 
// app.use(middlewares.session(app));
app.use(bodyparser());
app.use(middlewares.response);
app.use(middlewares.filter);

app.use(middlewares.needlogin);
app.use(middlewares.privileges);
/*
* @ author yanchong 
* @ router
*/ 
app.use(backRouter.routes())
	 .use(backRouter.allowedMethods())
   .use(frontRouter.routes())
   .use(frontRouter.allowedMethods());


/*
* @ author yanchong 
* @ response
*/ 
app.on('error', function(err, ctx){
  console.log(err);
  logger.error('server error', err, ctx);
  ctx.error(null, '服务器错误', null, err);
});

export default app;
