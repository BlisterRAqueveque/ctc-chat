import { createBot, createFlow, createProvider } from '@builderbot/bot';
import { MysqlAdapter as Database } from '@builderbot/database-mysql';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

import * as flows from './flows/index.js';

import { envs } from './configuration/envs.js';
// import { createTicket } from './services/ticket-service.js';

const PORT = envs.PORT;

console.log('🚀 [1/6] Iniciando aplicación CTC Chat...');
console.log('📋 Variables de entorno cargadas:', {
  PORT: envs.PORT,
  MYSQL_DB_HOST: envs.MYSQL_DB_HOST,
  MYSQL_DB_NAME: envs.MYSQL_DB_NAME,
  ODOO_URL: envs.ODOO_URL,
  ODOO_DB_NAME: envs.ODOO_DB_NAME,
});


const main = async () => {
  console.log('\n🔧 [2/6] Creando flujos del bot...');
  const adapterFlow = createFlow([
    //<===================== Comercial =====================>
    /** Asistencia comercial 01 */
    flows.mainMenuFlow,

    /** Asistencia comercial 02 */
    flows.registrar,
    flows.otraLocalidad,
    flows.ubicacionFlow,
    flows.nombreFlow,
    flows.quieroSerClienteFlow,

    /** Asistencia comercial 03 */
    flows.reactivarServicioFlow,
    flows.reactivarNombreFlow,
    flows.reactivarLocalidadFlow,

    /** Asistencia comercial 04 */
    flows.socioFlow,
    flows.socioDNIFlow,
    flows.socioNombreFlow,
    flows.mainClientFlow,

    /** Asistencia comercial 05 */
    flows.aboutClientFlow,
    flows.miServicioFlow,
    flows.endMessageAboutFlow,
    flows.cambioDomicilioFlow,
    flows.aumentarVelocidadFlow,
    flows.otrasConsultasFlow,
    flows.endMessageFlow,

    /** Asistencia comercial 06 */
    flows.mainFacturaFlow,

    /** Asistencia comercial 07 */
    flows.preFinishFlow,
    flows.finishFlow,

    //<===================== Técnica =====================>
    /** Asistencia técnica 01 */
    flows.soportePrincipalFlow,

    /** Asistencia técnica 02 */
    flows.soporteInternetFlow,
    flows.soporteInternetLocalidadFlow,
    flows.soporteInternetInconveniente,
    flows.sinAccesoInternetFlow,
    flows.sinAccesoInternetUnoFlow,
    flows.sinAccesoInternetDosFlow,
    flows.sinAccesoInternetTresFlow,
    flows.sinAccesoInternetCuatroFlow,
    flows.sinAccesoInternetCincoFlow,
    flows.soporteInternetFinFlow,

    /** Asistencia técnica 03 */
    flows.soporteTelefoniaMainFlow,
    flows.soporteTelefoniaLocalidadFlow,
    flows.soporteTelefoniaFlow,
    flows.soporteTelefoniaOtrosFlow,
    flows.soporteTelefoniaFinFlow,

    /** Asistencia técnica 04 */
    flows.soporteAsistenciaFlow,
    flows.soporteAsistenciaDatoFlow,
    flows.soporteInstalacionDatoFlow,
    flows.soporteAsistenciaFinFlow,

    /** Asistencia técnica 05 */
    flows.soporteOtrosFlow,

    /** Asistencia técnica 06 */
    flows.preFinishTecnicaFlow,
    flows.finishTecnicaFlow,
  ]);
  console.log('✅ Flujos creados correctamente');

  console.log('\n📱 [3/6] Configurando proveedor de WhatsApp (Baileys)...');
  const adapterProvider = createProvider(Provider);
  console.log('✅ Proveedor configurado');

  console.log('\n🗄️  [4/6] Configurando base de datos MySQL...');
  const adapterDB = new Database({
    host: envs.MYSQL_DB_HOST,
    user: envs.MYSQL_DB_USER,
    database: envs.MYSQL_DB_NAME,
    password: envs.MYSQL_DB_PASSWORD,
    port: envs.MYSQL_DB_PORT,
  });

    console.log('✅ Base de datos configurada');

  console.log('\n🤖 [5/6] Inicializando bot y servidor...');
     console.log('\n📱 [3/6] Configurando proveedor de WhatsApp (Baileys)...');
  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
  console.log('✅ Bot inicializado correctamente');

  console.log('\n📋 [6/6] Creando tablas en base de datos...');
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
  console.log('✅ Tabla registros_registrar creada');
  
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
  console.log('✅ Tabla registros_reactivar creada');
  
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
  console.log('✅ Tabla registros_clientes creada');
  
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

  await adapterDB.db.promise().query(`
    CREATE TABLE IF NOT EXISTS registros_tecnica_clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nro_cliente VARCHAR(255),
      telefono VARCHAR(255),
      dni VARCHAR(255),
      nombre VARCHAR(255),
      consulta VARCHAR(255),
      localidad VARCHAR(255),
      servicio VARCHAR(255),
      tipoGestion VARCHAR(255),
      dato VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  adapterProvider.server.post(
    '/v1/registros-tecnica-cliente',
    handleCtx(async (_, req, res) => {
      try {
        const {
          nro_cliente,
          nombre,
          dni,
          telefono,
          consulta = '',
          localidad = '',
          servicio = '',
          tipoGestion = '',
          dato = '',
        } = req.body;

        //! Insertamos los datos en nuestra base de datos personal
        const [result] = await adapterDB.db.promise().query(
          `INSERT INTO registros_tecnica_clientes
                (nro_cliente, nombre, dni, telefono, consulta, localidad, servicio, tipoGestion, dato)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nro_cliente,
            nombre,
            dni,
            telefono,
            consulta,
            localidad,
            servicio,
            tipoGestion,
            dato,
          ]
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

  // const ticketMock = {
  //   tipo_servicio: 'Internet',
  //   tipo_cliente: 'HOGAR',
  //   localidad: 'CENTENARIO',
  //   numero_telefono: '2995123456',
  //   dni_cuit: '30111222',
  //   title_name: 'Sin conexión desde anoche',
  //   detalle_inconveniente: 'El router prende pero no tengo acceso a internet',
  //   partner_id: 125, // ID del cliente en Odoo (puede ser cualquier int existente)
  //   suscription_id: 'S00185', // si tu Odoo usa contratos/suscripciones
  //   associated_line_id: '2207373782',
  //   team_id: 1, // ID del equipo de soporte (ver en Odoo → Helpdesk → Equipos)
  //   ticket_type_id: 'Reclamo Técnico',
  // };

  // const ticket = await createTicket(ticketMock);

  // console.log(ticket);

  await adapterDB.db.promise().query(`
    CREATE TABLE IF NOT EXISTS registros_tecnica_clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nro_cliente VARCHAR(255),
      telefono VARCHAR(255),
      dni VARCHAR(255),
      nombre VARCHAR(255),
      consulta VARCHAR(255),
      localidad VARCHAR(255),
      servicio VARCHAR(255),
      tipoGestion VARCHAR(255),
      dato VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tabla registros_tecnica_clientes creada');
  
  adapterProvider.server.post(
    '/v1/registros-tecnica-cliente',
    handleCtx(async (_, req, res) => {
      try {
        const {
          nro_cliente,
          nombre,
          dni,
          telefono,
          consulta = '',
          localidad = '',
          servicio = '',
          tipoGestion = '',
          dato = '',
        } = req.body;

        //! Insertamos los datos en nuestra base de datos personal
        const [result] = await adapterDB.db
          .promise()
          .query(
            'INSERT INTO registros_tecnica_clientes (nro_cliente, nombre, dni, telefono, consulta, localidad, servicio, tipoGestion, dato) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              nro_cliente,
              nombre,
              dni,
              telefono,
              consulta,
              localidad,
              servicio,
              tipoGestion,
              dato,
            ]
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

  console.log('\n🔍 Probando conexión a Odoo...');
  getPartnerServices(9551);

  console.log('\n🌐 Iniciando servidor HTTP en puerto', PORT);
  httpServer(PORT);
  
  console.log('\n✅ ¡Aplicación CTC Chat iniciada correctamente!');
  console.log('📱 Escanea el código QR para conectar WhatsApp');
  console.log(`🔗 API disponible en: ${envs.API_URL}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - POST ${envs.API_URL}v1/registrar`);
  console.log(`   - POST ${envs.API_URL}v1/reactivar-servicio`);
  console.log(`   - POST ${envs.API_URL}v1/registros-cliente`);
  console.log(`   - POST ${envs.API_URL}v1/registros-tecnica-cliente`);
  console.log(`   - GET  ${envs.API_URL}v1/cliente/:nro_cliente`);
  console.log(`   - GET  ${envs.API_URL}v1/logout`);
};

main().catch((error) => {
  console.error('\n❌ Error fatal al iniciar la aplicación:');
  console.error('Tipo:', error.name);
  console.error('Mensaje:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
