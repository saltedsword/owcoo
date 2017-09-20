'use strict';
import { ColumnModel, ProductModel, CodelistModel, Page } from '../../models/index';
import _ from 'lodash';

class Product {
    //保存初始化
    static async saveInit(ctx) {
        // let id = ctx.request.query.id;
        // let column = ctx.request.query.column;
        // if (!id && !privileges(ctx, OPTIONS.ADD, column) || id && !privileges(ctx, OPTIONS.UPDATE, column)) return;
        const id = ctx.params.id;
        const c = ctx.query.c;
        const result = {};
        // result.status = await CodelistModel.getCodes('art_status');

        if (id) {
            result.product = await ProductModel.findOne({_id: id}, {meta: 0, __v: 0});
        } else {
            result.product = {
                column: '',
                title: '',
                content: '',
                status: 0,
                subImgs: [],
              }
        }

        const column = (id && result.product) ? result.product.column : (c || null);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('product', column);
        if (!id && selectedOptions[selectedOptions.length-1]) {
            result.product.column = selectedOptions[selectedOptions.length-1];
        }
        result.options = options, result.selectedOptions = selectedOptions;
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let product = ctx.request.body.product;
        let id = product._id;
        let column = product.column;
        // if (!id && !privileges(ctx, OPTIONS.ADD, column) || id && !privileges(ctx, OPTIONS.UPDATE, column)) return;
        // 浏览量和创建人 只用于显示，不参与保存操作
        delete product.pv;
        delete product.creater;
        if (!product) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!product.title || !product.column || (!product.subImgs || product.subImgs.length == 0)) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        if (await ProductModel.findByTitle(product.title, id)) {
            console.log('已存在相同的标题！');
            ctx.errorMsg('已存在相同的标题！');
            return;
        }
        if (id) {
            let _product = await ProductModel.findById(id);
            product = _.assign(_product, product);
            product.meta.updater = ctx.uid;
        } else {
            delete product._id;
            product = new ProductModel(product);
            product.meta.creater = ctx.uid;
        }
        await product.save();
        ctx.successMsg('保存成功！');
    }
    // 分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    // 查询时，要根据查询人的权限，限制其查询的结果
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
        
        await ProductModel.listByPage(page);
        const { options, selectedOptions } = await ColumnModel.fetchByModule('product', query.column);
        page.options = options;
        page.selectedOptions = selectedOptions;
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                subImgs: item.subImgs,
                // content: item.content || '',
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                pv: item.pv || 0,
                title: item.title || '',
                status: item.status,
                _id: item._id
            };
        });
        ctx.success(page);
    }
    //删除
    static async del(ctx) {
        // let id = ctx.request.query.id;
        // let product = await ProductModel.findById(id);
        // if (!privileges(ctx, OPTIONS.DELETE, product.column)) return;
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await ProductModel.findById(id)) {
                ctx.errorMsg('该记录不存在或已删除！');
                return
            } else {
                let product = await ProductModel.remove({_id: id});
                ctx.delSuccess();
                return;
            }
        }
        ctx.errorArguments();
    }

    // 前台接口
    static async showProduct(ctx) {
        const id = ctx.params.id;
        if (!id) return ctx.errorArguments();
        let result = {};
        result.product = await ProductModel.findOne({_id: id});
        if (result.product) {
            const createAt = result.product.meta.createAt;
            result.product = {...result.product._doc, ...{createAt: result.product.createAt}};
            result.pre = await ProductModel.findOne({'meta.createAt': {$lt: createAt}}, {title: 1}).sort('-meta.createAt');
            result.next = await ProductModel.findOne({'meta.createAt': {$gt: createAt}}, {title: 1}).sort('meta.createAt');
        }
        ctx.success(result);
    }
    //分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    static async productList(ctx) {
        let query = ctx.request.query || {} ;
        query.searches = {}, query.filters = {};

        if (query.title) {
            query.searches.title = query.title;
        }
        if (query.column) {
            query.filters.column = await ColumnModel.fetchOffspringIds(query.column);
        }

        let page = new Page(query);
        
        await ProductModel.listByPage(page);
        page.list = page.list.map((item, index) => {
            return {
                column: item.column ? item.column.name : '',
                subImgs: item.subImgs,
                // content: item.content || '',
                createAt: item.createAt,
                creater: item.meta.creater ? item.meta.creater.name : '',
                pv: item.pv || 0,
                title: item.title || '',
                status: item.status,
                _id: item._id,
                abstract: item.abstract,
                price: item.price || '---'
            };
        });
        ctx.success(page);
    }
}

export default Product;