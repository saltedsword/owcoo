'use strict';
import { WebsiteModel, ColumnModel } from '../../models';
import _ from 'lodash';

class Website {
    
    //保存初始化
    static async saveInit(ctx) {
        let result = {};
        result.website = await WebsiteModel.findOne({}, {meta: 0, __v: 0});
        
        !result.website &&  (result.website = {
            title: '',
            logo: [],
            ico: [],
            keywords: '',
            description: '',
            rights: '',
            aboutUsId: '',
            aboutUsContent: '',
            aboutUsPic: [],
            banner: []
          });
        const { options: aboutUsOptions , selectedOptions: aboutUsSelectedOptions } = await ColumnModel.fetchByModule2('summary', result.website ? result.website.aboutUsId : null);
        ctx.success({...result, aboutUsOptions, aboutUsSelectedOptions});
    }
    //保存
    static async save(ctx) {
        let website = ctx.request.body.website;
        let id = website._id;
        if (!website) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!website.title) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }

        if (id) {
            let _website = await WebsiteModel.findById(id);
            website = _.assign(_website, website);
            website.meta.updater = ctx.uid;
            website = await website.save();
        } else {
            const _website = await WebsiteModel.findOne({});
            if (_website) {
                _.assign(_website, website);
                _website.meta.updater = ctx.uid;
                await _website.save();
            } else {
                delete website._id;
                website = new WebsiteModel(website);
                website.meta.creater = ctx.uid;
                await website.save();
            } 
        }
        return ctx.successMsg('保存成功！');
    }
}

export default Website;