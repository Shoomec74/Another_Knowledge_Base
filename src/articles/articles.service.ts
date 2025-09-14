import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article, ArticleDocument } from './schemas/article.schema';
import { Types } from 'mongoose';
import { PureAbility } from '@casl/ability';
import { EAction } from 'src/casl/ability.factory';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name)
    private readonly articleModel: Model<ArticleDocument>,
  ) { }

  async create(createArticleDto: CreateArticleDto, author: Types.ObjectId) {
    const created = await this.articleModel.create({
      ...createArticleDto,
      author,
    });

    await created.populate({ path: 'author', select: '_id username' });

    return created.toObject();
  }

  async findAll(tags?: string[]) {
    const filter: FilterQuery<ArticleDocument> = { deletedAt: { $in: [null] } };

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    return await this.articleModel.find(filter).lean();
  }

  async findOne(id: string) {
    const res = await this.articleModel.findOne({ _id: id, deletedAt: null }).lean();

    if (!res) {
      throw new NotFoundException('Статья не найдена');
    }

    return res;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    ability: PureAbility,
  ) {
    const article = await this.articleModel.findOne({ _id: id, deletedAt: null });

    if (!article) {
      throw new NotFoundException('Статья не найдена');
    }

    if (!ability.can(EAction.Update, article)) {
      throw new ForbiddenException('Вы не можете обновить эту статью');
    }

    const res = await this.articleModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { ...updateArticleDto, updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    if (!res) {
      throw new NotFoundException('Статья не найдена');
    }

    return res;
  }

  async remove(id: string, ability: PureAbility) {
    const article = await this.articleModel.findOne({ _id: id, deletedAt: null });

    if (!article) {
      throw new NotFoundException('Статья не найдена');
    }

    if (!ability.can(EAction.Delete, article)) {
      throw new ForbiddenException('Вы не можете удалить эту статью');
    }

    const res = await this.articleModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .lean();

    if (!res) {
      throw new NotFoundException('Статья не найдена');
    }

    return res;
  }
}
