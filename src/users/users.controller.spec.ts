import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { HashService } from 'src/common/hashService/hash.service';
import { AbilityGuard } from 'src/auth/guards/ability.guard';
import { JwtGuard } from 'src/auth/guards/jwtAuth.guards';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from 'src/casl/ability.factory';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUserModel: any;
  let mockHashService: Partial<HashService>;
  let mockAbilityFactory: Partial<AbilityFactory>;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };

    mockHashService = {
      getHash: jest.fn().mockResolvedValue('hashed-password'),
    } as Partial<HashService>;

    mockAbilityFactory = {
      defineAbility: jest.fn().mockResolvedValue({
        can: () => true,
        cannot: () => false,
      }),
    } as Partial<AbilityFactory>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: HashService, useValue: mockHashService },
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

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
