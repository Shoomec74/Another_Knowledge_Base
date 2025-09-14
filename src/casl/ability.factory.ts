import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  MatchConditions,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User } from 'src/users/schemas/user.schema';
import { Article, ArticleDocument } from 'src/articles/schemas/article.schema';
import Role from 'src/common/sharedTypes/roleEnum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export enum EAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  ReadAll = 'readAll',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects =
  | InferSubjects<typeof User | typeof Article>
  | 'users'
  | 'articles'
  | 'all';

@Injectable()
export class AbilityFactory {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
  ) {}

  private getRole(user, soughtRole): boolean {
    return Number(user?.role) === Number(soughtRole);
  }

  //-- Функция defineAbility определяет, что может делать пользователь в приложении --//
  async defineAbility(user: User): Promise<PureAbility> {
    /*
     *Для того чтобы организовать сложные правила, например для изменения, создания и т.д. с моделями ботов,
     *необходимо работать не с DTO, и не с моделью из БД,
     *используйте именно заинжектированную модель из БД например this.articleModel
     *так фабрика получит корректный Subjects передаваемой сущности из репозитория в правило для проверки.
     */
    type AppAbility = PureAbility<
      [EAction, Subjects | typeof this.articleModel]
    >;

    const lambdaMatcher = (matchConditions: MatchConditions) => matchConditions;

    const isSuperAdmin = this.getRole(user, Role.ADMIN);

    //-- Создаем строитель AbilityBuilder, который поможет нам определить правила доступа --//
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);

    //-- Здесь определяем правила доступа --//
    if (isSuperAdmin) {
      //-- Супер администраторы имеют доступ ко всем операциям в приложении --//
      can(EAction.Manage, 'all');
    } else {
      //-- Права на уровне ресурсов --//
      can(EAction.Read, 'articles');
      can(EAction.Create, 'articles');
      can(EAction.Update, 'articles');
      can(EAction.Delete, 'articles');
      can(EAction.Read, 'users');
      can(EAction.Update, 'users');

      cannot(
        [EAction.Delete, EAction.Create, EAction.ReadAll],
        'users',
      ).because(
        'Действия над пользователями доступны только для супер администратора',
      );

      //-- Условия на уровне объектов статей (владение) --//
      can(EAction.Update, this.articleModel, ({ author }) =>
        author.equals(user._id),
      );
      can(EAction.Delete, this.articleModel, ({ author }) =>
        author.equals(user._id),
      );
    }

    //-- Возвращаем сформированный набор правил в гарду --//
    return build({
      conditionsMatcher: lambdaMatcher,
      detectSubjectType: (object) =>
        object.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
