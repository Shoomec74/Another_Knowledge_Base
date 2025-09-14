import { Module } from '@nestjs/common';
import { AbilityFactory } from './ability.factory';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from 'src/articles/schemas/article.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  providers: [AbilityFactory],
  exports: [AbilityFactory],
})
export class AbilityModule {}
