import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { getModelToken } from '@nestjs/mongoose';
import { Article } from './schemas/article.schema';
import { AbilityGuard } from 'src/auth/guards/ability.guard';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guards';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from 'src/casl/ability.factory';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let mockArticleModel: any;
  let mockAbilityFactory: Partial<AbilityFactory>;

  beforeEach(async () => {
    mockArticleModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    mockAbilityFactory = {
      defineAbility: jest.fn().mockResolvedValue({
        can: () => true,
        cannot: () => false,
      }),
    } as Partial<AbilityFactory>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        ArticlesService,
        { provide: getModelToken(Article.name), useValue: mockArticleModel },
        {
          provide: JwtGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: AbilityGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        { provide: Reflector, useValue: {} },
        { provide: AbilityFactory, useValue: mockAbilityFactory },
      ],
    }).compile();

    controller = module.get<ArticlesController>(ArticlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
