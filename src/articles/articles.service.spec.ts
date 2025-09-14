import { Test } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { Article } from './schemas/article.schema';
import { Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let mockArticleModel: any;

  beforeEach(async () => {
    mockArticleModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getModelToken(Article.name), useValue: mockArticleModel },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  describe('create', () => {
    it('создать статью с автором', async () => {
      const dto = { title: 'Test', body: 'Content' };
      const authorId = new Types.ObjectId();

      mockArticleModel.create.mockResolvedValue({
        ...dto,
        author: authorId,
        populate: jest.fn().mockReturnThis(),
        toObject: jest.fn().mockReturnValue({ ...dto, author: authorId }),
      });

      const result = await service.create(dto, authorId);

      expect(mockArticleModel.create).toHaveBeenCalledWith({
        ...dto,
        author: authorId,
      });
      expect(result.title).toBe('Test');
    });
  });

  describe('findAll', () => {
    it('должно вернуть все статьи когда нет тегов', async () => {
      mockArticleModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await service.findAll();

      expect(mockArticleModel.find).toHaveBeenCalledWith({ deletedAt: { $in: [null] } });
    });

    it('должно фильтровать статьи по тегам когда они предоставлены', async () => {
      mockArticleModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await service.findAll(['tag1', 'tag2']);

      expect(mockArticleModel.find).toHaveBeenCalledWith({
        deletedAt: { $in: [null] },
        tags: { $in: ['tag1', 'tag2'] },
      });
    });
  });
});
