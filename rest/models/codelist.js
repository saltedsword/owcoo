'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CodelistSchema = new Schema({
    key: String,               //关键词
    desc: String,              //对关键词的描述
    value: String,             //代码值
    text: String,              //值描述
    sort: Number               //排序id，越小排名约靠前
});

CodelistSchema.statics = {
    getCode: async function(key, value) {
        return await this.findOne({key: key, value: value});
    },
    getCodeText: async function(key, value) {
        let code = await this.findOne({key: key, value: value});
            if (!code) {
                return '';
            }
        return code.text;
    },
    getCodes: async function(key) {
        return await this.find({key: key}, {value: 1, text: 1, _id: 0}).sort('sort');
    }
}
export default mongoose.model('Codelist', CodelistSchema);