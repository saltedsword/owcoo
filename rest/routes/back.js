import { Website, Column, Category, User, UserGroup, Picture, Manage, Article, Summary, CommonUpload, Download, Product, Resource } from '../controllers';
import koarouter from 'koa-router';
import Upload from '../middlewares/upload';

const router = koarouter();
router

  .get('/website/saveInit', Website.saveInit)
  .post('/website/save', Website.save)

  // 发布
  .get('/release/init', Column.releaseInit)
  .get('/release/getReleaseUrl', Column.getReleaseUrl)
  // 管理员
  .get('/user/saveInit', User.saveInit)                             // 保存初始化
  .get('/user/saveInit/:id', User.saveInit)                             // 保存初始化
  .post('/user/save', User.save)                                    // 保存
  .post('/user/login', User.login)                                // 移动初始化
  .get('/user/logInfo', User.logInfo)                                 // 移动
  .get('/user/del/:id', User.del)                                       // 删除
  .get('/user/list', User.list)                         // 用户列表

  // 栏目相关
  .get('/column/list', Column.init)                                     // 首页初始化
  // .get('/column/saveInit/:id', Column.saveInit)                             // 保存初始化
  .post('/column/save', Column.save)                                    // 保存
  .get('/column/moveInit/:id', Column.moveInit)                             // 移动初始化
  .post('/column/move', Column.move)                                    // 移动
  .get('/column/del/:id', Column.del)                                       // 删除
  .get('/column/tree', Column.tree)                                     // 获取栏目树

  // 上传接口相关
  .post('/uploadForElement',  Upload.qiniu, CommonUpload.uploadForElement)
  .post('/removeFiles',  CommonUpload.removeFiles)
  // 管理相关
  .get('/manage/manageInit', Manage.manageInit)
  .get('/manage/manageInit/:id', Manage.manageInit)
  .get('/manage/module', Manage.moduleQuery)
  .get('/manage/column', Manage.columnQuery)
  // 文章相关
  .get('/article/saveInit', Article.saveInit)
  .get('/article/saveInit/:id', Article.saveInit)
  .get('/article/list', Article.listByPage)
  .get('/article/del/:id', Article.del)
  .post('/article/save', Article.save)
  // 简介相关
  .get('/summary/saveInit', Summary.saveInit)
  .get('/summary/saveInit/:id', Summary.saveInit)
  .get('/summary/list', Summary.listByPage)
  .post('/summary/save', Summary.save)
  // 图片相关
  .get('/picture/saveInit', Picture.saveInit)
  .get('/picture/saveInit/:id', Picture.saveInit)
  .get('/picture/list', Picture.listByPage)
  .get('/picture/del/:id', Picture.del)
  .post('/picture/save', Picture.save)
  // 下载相关
  .get('/download/saveInit', Download.saveInit)
  .get('/download/saveInit/:id', Download.saveInit)
  .get('/download/list', Download.listByPage)
  .get('/download/del/:id', Download.del)
  .post('/download/save', Download.save)
  // 产品相关
  .get('/product/saveInit', Product.saveInit)
  .get('/product/saveInit/:id', Product.saveInit)
  .get('/product/list', Product.listByPage)
  .get('/product/del/:id', Product.del)
  .post('/product/save', Product.save)

  // 权限系统
  // 资源管理
  .get('/resource/list', Resource.list)
  .get('/resource/saveInit', Resource.saveInit)
  .get('/resource/saveInit/:id', Resource.saveInit)
  .post('/resource/save', Resource.save)
  .get('/resource/del/:id', Resource.del)
  // 用户组管理
  .get('/userGroup/list', UserGroup.list)
  .get('/userGroup/saveInit', UserGroup.saveInit)
  .get('/userGroup/saveInit/:id', UserGroup.saveInit)
  .post('/userGroup/save', UserGroup.save)
  .get('/userGroup/del/:id', UserGroup.del)



export default router;