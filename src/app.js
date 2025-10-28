import { createBot, createFlow, createProvider } from '@builderbot/bot';
import { MysqlAdapter as Database } from '@builderbot/database-mysql';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import * as flows from './flows/index.js';

import { envs } from './configuration/envs.js';

const PORT = envs.PORT;

const main = async () => {
  const adapterFlow = createFlow([
    flows.mainMenuFlow,

    flows.registrar,
    flows.quieroSerClienteFlow,
    flows.ubicacionFlow,
    flows.nombreFlow,
    flows.otraLocalidad,

    flows.reactivarServicioFlow,
    flows.reactivarNombreFlow,
    flows.reactivarLocalidadFlow,

    flows.socioFlow,
    flows.socioDNIFlow,
    flows.socioNombreFlow,

    flows.mainClientFlow,
    flows.aboutClientFlow,
    flows.miServicioFlow,
    flows.endMessageAboutFlow,
    flows.cambioDomicilioFlow,
    flows.aumentarVelocidadFlow,
    flows.otrasConsultasFlow,
    flows.endMessageFlow,

    flows.mainFacturaFlow,

    flows.preFinishFlow,
    flows.finishFlow,

    /** Asistencia técnica */
    flows.soportePrincipalFlow,
    flows.soporteInternetFlow,
    flows.soporteTelefoniaFlow,
    flows.soporteAsistenciaFlow,
    flows.soporteOtrosFlow,
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
      nombre VARCHAR(255),
      telefono VARCHAR(255),
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

  await adapterDB.db.promise().query(`
    CREATE TABLE IF NOT EXISTS registros_reactivar (
      id INT AUTO_INCREMENT PRIMARY KEY,
      localidad INT,
      dni VARCHAR(255),
      nombre VARCHAR(255),
      telefono VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  adapterProvider.server.post(
    '/v1/reactivar-servicio',
    handleCtx(async (_, req, res) => {
      try {
        const { localidad, nombre, telefono, dni } = req.body;

        //! Insertamos los datos en nuestra base de datos personal
        const [result] = await adapterDB.db
          .promise()
          .query(
            'INSERT INTO registros_reactivar (localidad, nombre, telefono, dni) VALUES (?, ?, ?, ?)',
            [localidad, nombre, telefono, dni]
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

  adapterProvider.server.get(
    '/v1/cliente/:nro_cliente',
    handleCtx(async (_, req, res) => {
      try {
        const { nro_cliente } = req.params;

        if (!nro_cliente) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              status: 404,
              message: 'miss_params',
            })
          );
        }

        // TODO Buscamos el cliente en la base de datos de ODOO (acá simulamos con una db local)
        const [result] = await adapterDB.db
          .promise()
          .query('SELECT * FROM clientes WHERE nro_cliente = ?', [nro_cliente]);

        if (result.length == 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              status: 404,
              message: 'no_client',
            })
          );
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 200, client: result[0] }));
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(
          JSON.stringify({ status: 'error', message: error.message })
        );
      }
    })
  );

  await adapterDB.db.promise().query(`
    CREATE TABLE IF NOT EXISTS registros_clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nro_cliente VARCHAR(255),
      telefono VARCHAR(255),
      dni VARCHAR(255),
      nombre VARCHAR(255),
      consulta VARCHAR(255),
      lat VARCHAR(255),
      lon VARCHAR(255),
      ubicacion VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  adapterProvider.server.post(
    '/v1/registros-cliente',
    handleCtx(async (_, req, res) => {
      try {
        const {
          nro_cliente,
          nombre,
          dni,
          telefono,
          consulta,
          lat = '',
          lon = '',
          ubicacion = '',
        } = req.body;

        //! Insertamos los datos en nuestra base de datos personal
        const [result] = await adapterDB.db
          .promise()
          .query(
            'INSERT INTO registros_clientes (nro_cliente, nombre, dni, telefono, consulta, lat, lon, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nro_cliente, nombre, dni, telefono, consulta, lat, lon, ubicacion]
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

  adapterProvider.server.get('/v1/logout', async (req, res) => {
    try {
      const instance = await adapterProvider.getInstance();

      if (instance?.logout) {
        await instance.logout();
        res.end('logout success');
      } else {
        res.end('No se pudo cerrar sesión: instancia inválida');
      }
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      res.end('Error al cerrar sesión');
    }
  });

  httpServer(PORT);
};

main();
