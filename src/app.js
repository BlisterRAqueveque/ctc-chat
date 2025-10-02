import { createBot, createFlow, createProvider } from '@builderbot/bot';
import { MysqlAdapter as Database } from '@builderbot/database-mysql';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import {
  mainMenuFlow,
  registrar,
  quieroSerClienteFlow,
  ubicacionFlow,
  nombreFlow,
  otraLocalidad,
  preFinishFlow,
  finishFlow,
} from './flows/index.js';
import { envs } from './configuration/envs.js';

const PORT = envs.PORT;

const main = async () => {
  const adapterFlow = createFlow([
    mainMenuFlow,

    registrar,
    quieroSerClienteFlow,
    ubicacionFlow,
    nombreFlow,
    otraLocalidad,

    preFinishFlow,
    finishFlow,
  ]);

  const adapterProvider = createProvider(Provider);

  const adapterDB = new Database({
    host: envs.MYSQL_DB_HOST,
    user: envs.MYSQL_DB_USER,
    database: envs.MYSQL_DB_NAME,
    password: envs.MYSQL_DB_PASSWORD,
    port: envs.MYSQL_DB_PORT,
  });

  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  // Crear la tabla si no existe
  await adapterDB.db.promise().query(`
    CREATE TABLE IF NOT EXISTS registros_registrar (
      id INT AUTO_INCREMENT PRIMARY KEY,
      localidad INT,
      lat VARCHAR(255),
      lon VARCHAR(255),
      ubicacion VARCHAR(255),
      nombre VARCHAR(100),
      telefono VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  adapterProvider.server.post(
    '/v1/registrar',
    handleCtx(async (_, req, res) => {
      try {
        const {
          localidad,
          lat,
          lon = '',
          ubicacion = '',
          nombre,
          telefono,
        } = req.body;

        //! Insertamos los datos en nuestra base de datos personal
        const [result] = await adapterDB.db
          .promise()
          .query(
            'INSERT INTO registros_registrar (localidad, lat, lon, ubicacion, nombre, telefono) VALUES (?, ?, ?, ?, ?, ?)',
            [localidad, lat, lon, ubicacion, nombre, telefono]
          );

        // result.insertId contiene el ID generado
        // TODO La idea es poder insertar en ODOO, y enviar el n° de ticket al usuario
        const ticketId = result.insertId;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', ticketId }));
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(
          JSON.stringify({ status: 'error', message: error.message })
        );
      }
    })
  );

  httpServer(PORT);
};

main();
