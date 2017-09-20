import { Picture, Manage, Article, Summary, Download, Product, FrontHome } from '../controllers';
import koarouter from 'koa-router';

const router = koarouter();
router
  // article
  .get('/front/articleList', Article.articleList)
  .get('/front/showArticle/:id', Article.showArticle)
    // download
  .get('/front/downloadList', Download.downloadList)
  .get('/front/showDownload/:id', Download.showDownload)
    // picture
  .get('/front/pictureList', Picture.pictureList)
  .get('/front/showPicture/:id', Picture.showPicture)
    // article
  .get('/front/productList', Product.productList)
  .get('/front/showProduct/:id', Product.showProduct)
    // article
  .get('/front/showSummary/:id', Summary.showSummary)

  .get('/front/headerInit', FrontHome.frontHeaderInit)
  .get('/front/contentInit', FrontHome.frontContentInit)
  .get('/front/footerInit', FrontHome.frontFooterInit)
  .get('/front/homeInit', FrontHome.frontHomeInit)
  .get('/front/init', FrontHome.frontInit)


export default router;