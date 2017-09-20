'use strict';
import { ColumnModel, ArticleModel, PictureModel, ProductModel, SummaryModel, WebsiteModel } from '../../models/index';
import mModels from '../../models/modules';
import moment from 'moment';

class Home {
    
    static async frontInit(ctx) {
        let result = {};
        const { type, id } = ctx.query;
        let detail;
        if (!type || !id) {
          detail = '';
        } else if (type === 'column'){
          const cl = await ColumnModel.findById(id);
          detail = cl ? cl.name + ' - ' : '';
        } else {
          if (!mModels[type]) {
            detail = '';
          } else {
            if (type === 'summary') {
              const obj = await mModels[type].findOne({column: id}).populate('column', 'name');
              detail = obj ? obj.column.name + ' - ' : '';
            } else {
              const obj = await mModels[type].findOne({_id: id}).populate('column', 'name');
              detail = obj ? obj.title + ' - ' + obj.column.name + ' - ' : '';
            }
          }
          
        }
        const website = await WebsiteModel.findOne({});
        if (website) {
          result.meta = {
            title: detail + website.title,
            meta: {
              name: {
                keywords: website.keywords,
                description: website.description,
              }
            },
            link: {
              rel: {
                'shortcut icon': website.ico[0].url
              }
            }
          }
        }
        return ctx.success(result);
    }

    static async frontHeaderInit(ctx) {
        const frontHeaderTree = await ColumnModel.fetchFrontHeaderTree();
        const { logo } = await WebsiteModel.findOne({});
        return ctx.success({tree: frontHeaderTree, logo: logo[0].url});
    }

    static async frontContentInit(ctx) {
        const { type, id } = ctx.query;
        await Home.countPV(type, id);
        return ctx.success(await ColumnModel.fetchFrontContentTree(type, id));
    }

    static async frontHomeInit(ctx) {
        // banner
        // aboutUs
        // articles
        // pictures
        // products
        const result = {
          banner: [],
          aboutUs: {},
          articles: [],
          products: [],
          pictures: [],
          meta: {}
        };

        const website = await WebsiteModel.findOne({});
        if (website) {
          result.banner = website.banner;
          result.aboutUs = {
            id: website.aboutUsId,
            content: website.aboutUsContent,
            pic: website.aboutUsPic
          }
          result.meta = {
            title: website.title,
            meta: {
              name: {
                keywords: website.keywords,
                description: website.description,
              }
            },
            link: {
              rel: {
                'shortcut icon': website.ico[0].url
              }
            }
          }
        }
        
        const products = await ProductModel.find({}).sort('-status -meta.updateAt').limit(8);
        result.products = products.map(el => ({
          _id: el._id,
          title: el.title,
          price: el.price || '---',
          img: el.subImgs[0] ? el.subImgs[0].url : '',
          date: moment(el.createAt).format('YYYY-MM-DD'),
          pv: el.pv || 0
        }));

        const pictures = await PictureModel.find({}).sort('-status -meta.updateAt').limit(8);
        result.pictures = pictures.map(el => ({
          _id: el._id,
          title: el.title,
          abstract: el.abstract,
          img: el.subImgs[0] ? el.subImgs[0].url : '',
          date: moment(el.createAt).format('YYYY-MM-DD'),
          pv: el.pv || 0,
        }));
        result.articles = await ArticleModel.fetchFrontArticles();
        // 浏览更多 默认取 第一个对象对应的栏目
        result.moreArticles = result.articles[0] ? result.articles[0].column : '';
        result.morePictures = pictures[0] ? pictures[0].column : '';
        result.moreProducts = products[0] ? products[0].column : '';
        return ctx.success(result);
        
    }

    static async frontFooterInit(ctx) {
        const frontFooterTree = await ColumnModel.fetchFrontFooterTree();
        const { rights } = await WebsiteModel.findOne({});
        return ctx.success({tree: frontFooterTree, rights});
    }

    static async countPV(type, id) {
        if (!type || !id || type === 'summary' || !mModels[type]) return false;
        const Model = mModels[type];
        const obj = await Model.findOne({_id: id});
        if (!obj) return false;
        const pv = (obj.pv || 0) + 1;
        await Model.update({_id: id}, {pv: pv});
    }
}

export default Home;