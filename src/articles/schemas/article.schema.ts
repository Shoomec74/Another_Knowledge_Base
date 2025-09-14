import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

@Schema()
export class Article extends Document {
  @Prop({ required: true, minlength: 2, maxlength: 100 })
  title: string;

  @Prop({ type: String, maxlength: 1000 })
  body: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  author: User;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Boolean, default: false })
  isPublished: boolean;

  @Prop({ type: Boolean, default: false })
  isPublic: boolean;

  @Prop({ type: Boolean, default: false })
  isDraft: boolean;
}

export type ArticleDocument = HydratedDocument<Article>;

export const ArticleSchema = SchemaFactory.createForClass(Article);
