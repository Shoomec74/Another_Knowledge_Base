import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import mongoose, { Types } from 'mongoose';
import { ITokens } from 'src/common/sharedTypes/tokens';
import { HashService } from 'src/common/hashService/hash.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly hashService: HashService,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ 'credentials.email': email, deletedAt: null });
  }

  async saveRefreshToken(userId: Types.ObjectId, tokens: ITokens) {
    const updateQuery: UpdateQuery<any> = {
      $set: {
        'credentials.accessToken': tokens.accessToken,
        'credentials.refreshToken': tokens.refreshToken,
      },
    };

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: userId }, updateQuery, { new: true })
      .select({ 'credentials.password': 0 });

    if (updatedUser) {
      return updatedUser;
    } else {
      throw new UnauthorizedException('Невалидный refreshToken');
    }
  }

  async findAndDeleteRefreshToken(refreshToken: string) {
    const account = await this.userModel
      .findOne({ 'credentials.refreshToken': refreshToken, deletedAt: null })
      .select({ 'credentials.password': 0 });

    if (account) {
      account.credentials.refreshToken = undefined;

      await account.save();

      return account;
    } else {
      return null;
    }
  }

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, role } = createUserDto;

    const existing = await this.userModel
      .findOne({ 'credentials.email': email })
      .lean();

    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await this.hashService.getHash(password);

    const created = await this.userModel.create({
      username,
      credentials: { email, password: passwordHash },
      role,
    });

    return await this.userModel
      .findById(created._id)
      .lean();
  }

  async findAll() {
    return await this.userModel
      .find({ deletedAt: null }, { 'credentials.password': 0 })
      .lean();
  }

  async findOne(id: Types.ObjectId) {
    const user = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select({ 'credentials.password': 0 })
      .lean();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async update(
    id: Types.ObjectId,
    updateUserDto: UpdateUserDto,
    session?: mongoose.ClientSession,
  ): Promise<User> {
    const setPayload: Record<string, any> = {
      ...updateUserDto,
      updatedAt: new Date(),
    };

    if (updateUserDto.password) {
      const passwordHash = await this.hashService.getHash(updateUserDto.password);

      setPayload['credentials.password'] = passwordHash;

      delete setPayload.password;
    }

    const updateQuery: UpdateQuery<any> = {
      $set: setPayload,
    };

    const updated = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, updateQuery, { new: true })
      .select({ 'credentials.password': 0 })
      .session(session)
      .lean();

    if (!updated) {
      throw new NotFoundException('Пользователь не найден');
    }

    return updated as any;
  }

  async remove(id: Types.ObjectId) {
    const res = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .select({ 'credentials.password': 0 })
      .lean();

    if (!res) {
      throw new NotFoundException('User not found');
    }

    return res;
  }
}
