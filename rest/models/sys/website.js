'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const WebsiteSchema = new Schema({
    title: String,
    logo: [],
    ico: [],
    keywords: String,
    description: String,
    rights: String,
    aboutUsId: {
        type: Schema.Types.ObjectId,
        ref: 'Column'
    },
    aboutUsContent: String,
    aboutUsPic: [],
    banner: [],
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

WebsiteSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.updateAt = this.meta.createAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    next();
});

export default mongoose.model('Website', WebsiteSchema);