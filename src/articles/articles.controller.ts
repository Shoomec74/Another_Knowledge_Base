import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  NotFoundException
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guards';
import { AbilityGuard } from 'src/auth/guards/ability.guard';
import { CheckAbility } from 'src/casl/decorator/ability.decorator';
import { EAction } from 'src/casl/ability.factory';
import { OptionalJwtGuard } from 'src/auth/guards/optionalJwt.guard';
import { TJwtRequest } from 'src/common/sharedTypes/jwtRequest';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @UseGuards(JwtGuard, AbilityGuard)
  @CheckAbility({ action: EAction.Create, subject: 'articles' })
  @Post()
  async create(
    @Req() req: TJwtRequest,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.create(createArticleDto, req.user._id);
  }

  @UseGuards(OptionalJwtGuard)
  @Get()
  async findAll(@Query('tags') tags?: string, @Req() req?: any) {
    const tagList = tags
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    if (!req?.user) {
      return this.articlesService
        .findAll(tagList)
        .then((items) => items.filter((a) => a.isPublic && a.isPublished && !a.isDraft));
    }

    return this.articlesService.findAll(tagList);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req?: any) {
    const article = await this.articlesService.findOne(id);
    if (!req?.user && (!article.isPublic || !article.isPublished)) {
      throw new NotFoundException(
        'Статья не найдена',
      );
    }
    return article;
  }

  @UseGuards(JwtGuard, AbilityGuard)
  @CheckAbility({ action: EAction.Update, subject: 'articles' })
  @Patch(':id')
  async update(
    @Req() req: TJwtRequest,
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto, req.ability);
  }

  @UseGuards(JwtGuard, AbilityGuard)
  @CheckAbility({ action: EAction.Delete, subject: 'articles' })
  @Delete(':id')
  async remove(@Req() req: TJwtRequest, @Param('id') id: string) {
    return this.articlesService.remove(id, req.ability);
  }
}
