import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  //-- App --//
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'prod')
    .default('development'),
  APP_PORT: Joi.number().port().required(),
  ALLOW_URL: Joi.string().uri({ allowRelative: true }).required(),

  //-- MongoDB --//
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_REPLICATION_SET: Joi.string().required(),

  //-- JWT --//
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES: Joi.string().default('1d'),
}).prefs({ convert: true });
