'use strict';
import { Page, ArticleModel, CodelistModel, ColumnModel } from '../../models/index';
import _ from 'lodash';

class Article {
    //保存初始化
    static async saveInit(ctx) {
        const id = ctx.params.id;
        const c = ctx.query.c;
        const result = {};
        // result.status = await CodelistModel.getCodes('art_status');

        if (id) {
            result.article = await ArticleModel.findOne({_id: id}, {meta: 0, __v: 0});
        } else {
            result.article = {
                column: '',
                title: '',
                content: '',
                status: 0,
              }
        }

        const column = (id && result.article) ? result.article.column : (c || null);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('article', column);
        if (!id && selectedOptions[selectedOptions.length-1]) {
            result.article.column = selectedOptions[selectedOptions.length-1];
        }
        result.options = options, result.selectedOptions = selectedOptions;
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let article = ctx.request.body.article;
        console.log(article)
        let id = article._id;
        if (!article) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!article.title || !article.column) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        if (await ArticleModel.findByTitle(article.title, id)) {
            console.log('已存在相同的标题！');
            ctx.errorMsg('已存在相同的标题！');
            return;
        }
        if (id) {
            let _article = await ArticleModel.findById(id);
            article = _.assign(_article, article);
            article.meta.updater = ctx.uid;
            article = await article.save();
        } else {
            delete article._id;
            article = new ArticleModel(article);
            article.meta.creater = ctx.uid;
            article = await article.save();
        }
        ctx.successMsg('保存成功！');
    }
    //分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    static async listByPage(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};

        if (query.title) {
            query.searches.title = query.title;
        }
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await ArticleModel.listByPage(page);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('article', query.column);
        page.options = options;
        page.selectedOptions = selectedOptions;
        page.list = page.list.map((item, index) => {
            return {
                column: item.column.name,
                // content: item.content,
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                title: item.title,
                status: item.status,
                pv: item.pv,
                _id: item._id
            };
        });
        ctx.success(page);
    }
    //删除
    static async del(ctx) {
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await ArticleModel.findById(id)) {
                ctx.errorMsg('该记录不存在或已删除！');
                return
            } else {
                let article = await ArticleModel.remove({_id: id});
                ctx.delSuccess();
                return;
            }
        }
        ctx.errorArguments();
    }

    // 前台接口
    static async showArticle(ctx) {
        const id = ctx.params.id;
        if (!id) return ctx.errorArguments();
        let result = {};
        result.article = await ArticleModel.findOne({_id: id});
        if (result.article) {
            const createAt = result.article.meta.createAt;
            result.article = {...result.article._doc, ...{createAt: result.article.createAt}};
            result.pre = await ArticleModel.findOne({'meta.createAt': {$lt: createAt}}, {title: 1}).sort('-meta.createAt');
            result.next = await ArticleModel.findOne({'meta.createAt': {$gt: createAt}}, {title: 1}).sort('meta.createAt');
        }
        ctx.success(result);
    }
    //分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    static async articleList(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};

        if (query.title) {
            query.searches.title = query.title;
        }
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await ArticleModel.listByPage(page);
        page.list = page.list.map((item, index) => {
            return {
                column: item.column.name,
                // content: item.content,
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                title: item.title,
                status: item.status,
                pv: item.pv,
                _id: item._id,
                abstract: item.abstract,
            };
        });
        ctx.success(page);
    }

}

export default Article;