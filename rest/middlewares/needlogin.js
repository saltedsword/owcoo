import Jwt from '../utils/jwt';

export default async (ctx, next) => {
  const noFilters = ['/user/login', '/user/logout', '/user/logInfo', '/uploadForElement'];

  if (ctx.url.startsWith('/front/')) return await next();
  
  for (let i=0; i<noFilters.length; i++) {
    if (ctx.url === noFilters[i]) return await next();
  }
  // console.log(ctx.session.user)
  // if (!ctx.session.user) {
  //   return ctx.errorMsg('需要先登录！');
  // } else {
  //   await next();
  // }

  const auth = ctx.headers.authorization;
  if (!auth) return ctx.needLogin('未携带授权信息！');
  const token = auth.split('Bearer ')[1];
  if (!token) return ctx.needLogin('授权信息格式有误！');

  const result = Jwt.verify(token);
  if (!result.success) return ctx.needLogin('token无效！');
  ctx.uid = result.data._id;
  return await next();
}