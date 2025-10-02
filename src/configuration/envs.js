import joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    API_URL: joi.string().required(),
    MYSQL_DB_HOST: joi.string().required(),
    MYSQL_DB_PORT: joi.number().required(),
    MYSQL_DB_USER: joi.string().required(),
    MYSQL_DB_NAME: joi.string().required(),
    MYSQL_DB_PASSWORD: joi.string().allow('').optional(),
  })
  .unknown(true);

const { value: envsVar, error } = envsSchema.validate(process.env);

if (error) throw new Error(`Config validation error: ${error.message}`);

export const envs = {
  PORT: envsVar.PORT,
  API_URL: envsVar.API_URL,
  MYSQL_DB_HOST: envsVar.MYSQL_DB_HOST,
  MYSQL_DB_PORT: envsVar.MYSQL_DB_PORT,
  MYSQL_DB_USER: envsVar.MYSQL_DB_USER,
  MYSQL_DB_NAME: envsVar.MYSQL_DB_NAME,
  MYSQL_DB_PASSWORD: envsVar.MYSQL_DB_PASSWORD,
};
