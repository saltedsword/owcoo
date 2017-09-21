'use strict';
import mongoose from 'mongoose';
import moment from 'moment';
const Schema = mongoose.Schema;
import ColumnModel from '../manage/column';

const ArticleSchema = new Schema({
    title: String,                   //标题
    column: {                        //所属栏目
        type: Schema.Types.ObjectId,
        ref: 'Column'
    },
    content: String,                 //内容描述
    status: Number,                  //状态：比如 置顶、推荐
    pv: { type: Number, default: 0 },
    abstract: String,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        },
        creater: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updater: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }
});

ArticleSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.updateAt = this.meta.createAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    next();
});

ArticleSchema.virtual('createAt').get(function () {
  return moment(this.meta.createAt).format('YYYY-MM-DD HH:mm:ss');
});

ArticleSchema.statics = {
    findById: async function(id) {
        return await this.findOne({_id: id}).populate({ path: 'column', select: 'name' });
    },
    findByTitle: async function(title, id) {
        if (id) {
            return await this.findOne({title: title, _id: {$ne: id}});
        }
        return await this.findOne({title: title});
    },
    listByPage: async function(page) {
        let filters = page.filters;
        let searches = page.searches;
        for (let k in searches) {
            let keyword = searches[k];
            let reg = new RegExp(keyword, 'i');
            filters[k] = {$regex : reg};
        }
        let sortBy = page.sortBy || 'meta.createAt_desc';

        let sortKey = sortBy.substring(0, sortBy.indexOf('_'));
        let sortText = sortBy.substring(sortBy.indexOf('_')+1, sortBy.length);
        let sortStr = '';
        switch (sortKey) {
            case 'updateAt': sortStr = 'meta.updateAt'; break;
            case 'createAt': sortStr = 'meta.createAt'; break;
            default: sortStr = sortKey;
        }
        if ('desc' == sortText) {
            sortStr = '-' + sortStr; 
        }
        let result = await this.find(filters)
                           .populate('column meta.creater', 'name -_id')
                           .sort(sortStr)
                           .skip(page.skip)
                           .limit(page.limit);
        let count = await this.find(filters).count();

        return page.pageQuery(result, count);
    },
    // 前台首页用，查出所有文章栏目下的 文章列表, 只取叶子节点
    fetchFrontArticles: async function() {
        const columns = await ColumnModel.fetchLeafByModule('article');
        const result = [];
        for (let i in columns) {
            const el = columns[i];
            const articleList = {};
            articleList._id = el._id;
            articleList.name = el.name;
            articleList.column = el._id;
            let articles = await this.find({column: el._id}).sort('-status -meta.updateAt').limit(10);
            articles = articles.map(article => ({
                _id: article._id,
                title: article.title,
                simpleTitle: article.title.length > 16 ? article.title.substring(0, 15) + '...' : article.title,
                date: moment(article.createAt).format('MM-DD'),
            }))
            articleList.articles = articles;
            result.push(articleList);
        }
        
        return result;
    },
}
export default mongoose.model('Article', ArticleSchema);