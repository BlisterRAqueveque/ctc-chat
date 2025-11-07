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
    ODOO_URL: joi.string().required(),
    ODOO_DB_NAME: joi.string().required(),
    ODOO_USERNAME: joi.string().required(),
    ODOO_USERID: joi.number().required(),
    ODOO_PASSWORD: joi.string().required(),
    ODOO_API_KEY: joi.string().required(),
    ODOO_API: joi.string().required(),
    ODOO_LOGIN: joi.string().required(),
    ODOO_PASS: joi.string().required(),
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

  ODOO_URL: envsVar.ODOO_URL,
  ODOO_DB_NAME: envsVar.ODOO_DB_NAME,
  ODOO_USERNAME: envsVar.ODOO_USERNAME,
  ODOO_USERID: envsVar.ODOO_USERID,
  ODOO_PASSWORD: envsVar.ODOO_PASSWORD,
  ODOO_API_KEY: envsVar.ODOO_API_KEY,

  ODOO_API: envsVar.ODOO_API,
  ODOO_LOGIN: envsVar.ODOO_LOGIN,
  ODOO_PASS: envsVar.ODOO_PASS,
};
