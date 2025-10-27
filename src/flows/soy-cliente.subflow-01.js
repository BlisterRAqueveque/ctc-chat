import { addKeyword, utils } from '@builderbot/bot';
import { envs } from '../configuration/envs.js';
import { mainClientFlow } from './soy-cliente.flow.js';

const textAbout = [
  { body: '1. *¿Qué servicio tengo?*' },
  { body: '2. *Cambio de domicilio*' },
  { body: '3. *Aumentar la velocidad*' },
  { body: '4. *Otras consultas*' },
  { body: '5. *Volver al menú*' },
];

export const aboutClientFlow = addKeyword(
  utils.setEvent('SOBRE_SERVICIO')
).addAnswer(
  'Quiero saber sobre mi servicio (*solo números*)' +
    textAbout.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [
    //   { body: '1. ¿Qué servicio tengo?' },
    //   { body: '2. Cambio de domicilio' },
    //   { body: '3. Aumentar la velocidad' },
    //   { body: '4. Otras consultas' },
    //   { body: '5. Volver al menú' },
    // ],
  },
  async (ctx, { fallBack, gotoFlow, state }) => {
    const opt = ctx.body;

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'): {
        //TODO Buscar los datos del usuario (formato Odoo)
        const mockData = {
          id: 1,
          datos: 'Alguno',
        };
        await state.update({ miServicio: JSON.stringify(mockData) });
        return gotoFlow(miServicioFlow);
      }
      case opt.includes('2'): {
        await state.update({ consulta: ctx.body.split('. ')[1] });

        return gotoFlow(cambioDomicilioFlow);
      }
      case opt.includes('3'): {
        await state.update({ consulta: ctx.body.split('. ')[1] });

        return gotoFlow(aumentarVelocidadFlow);
      }
      case opt.includes('4'):
        return gotoFlow(otrasConsultasFlow);
      case opt.includes('5'):
        return gotoFlow(mainClientFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);

//<============ OPCIÓN N° 1 ============>
//TODO la data es la información del usuario (acá se deberá devolver la información del usuario, con el formato de Odoo)

export const miServicioFlow = addKeyword(
  utils.setEvent('MI_SERVICIO')
).addAnswer(
  'Sobre su servicio:',
  null,
  async (_, { flowDynamic, state, gotoFlow }) => {
    try {
      // Obtener datos del cliente desde Odoo (guardados en el state)
      const { cliente_odoo } = state.getMyState();

      if (cliente_odoo) {
        const info = `
📋 *Información de su servicio:*

👤 *Cliente:* ${cliente_odoo.name}
🔢 *N° Contrato:* ${cliente_odoo.x_studio_id_de_contrato || 'No disponible'}
📞 *Teléfono:* ${cliente_odoo.phone || 'No disponible'}
📧 *Email:* ${cliente_odoo.email || 'No disponible'}
🏠 *Dirección:* ${cliente_odoo.street || 'No disponible'}
🏙️ *Ciudad:* ${cliente_odoo.city || 'No disponible'}
        `;

        await flowDynamic(info);
      } else {
        await flowDynamic(
          '❌ No se pudo obtener la información del servicio. Intente nuevamente.'
        );
      }
    } catch (error) {
      console.error('Error obteniendo información del servicio:', error);
      await flowDynamic(
        '⚠️ Error temporal obteniendo la información. Intente más tarde.'
      );
    }

    return gotoFlow(endMessageAboutFlow);
  }
);

const textEnd = [
  { body: '0. *Mejorar / cambiar mi servicio*' },
  { body: '1. *Volver al menú*' },
  { body: '2. *Finalizar*' },
];

export const endMessageAboutFlow = addKeyword(
  utils.setEvent('END_FLOW_CLIENT')
).addAnswer(
  '¿Qué desea hacer ahora? (*solo números*)' +
    textEnd.map((b) => `\n${b.body}`),
  {
    capture: true,
    // buttons: [
    //   { body: '0. Mejorar / cambiar mi servicio' },
    //   { body: '1. Volver al menú' },
    //   { body: '2. Finalizar' },
    // ],
  },
  async (ctx, { gotoFlow, endFlow, fallBack, state, flowDynamic }) => {
    const opt = ctx.body.toLocaleLowerCase();

    const { nro_cliente, nombre, dni } = state.getMyState();

    if (opt.includes('0')) {
      fetch(`${envs.API_URL}v1/registros-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nro_cliente,
          nombre,
          dni,
          telefono: ctx.from,
          consulta: ctx.body.split('. ')[1],
        }),
      })
        .then(async (res) => {
          const json = await res.json(); // <-- leer el JSON de la respuesta
          let ticketId = json ? json.ticketId : 'Sin ticket asignado';

          await flowDynamic(
            `Perfecto ${state.get(
              'nombre'
            )}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
          );

          return gotoFlow(endMessageFlow);
        })
        .catch(async (err) => {
          await flowDynamic(
            `Ocurrió un error durante la obtención de la información. Error: ${JSON.stringify(
              err
            )}`
          );
          return gotoFlow(endMessageFlow);
        });
    }
    if (opt.includes('1')) return gotoFlow(aboutClientFlow);
    if (opt.includes('2')) return endFlow('Gracias por confiar en nosotros');
    else return fallBack('Opción ingresada incorrecta');
  }
);
//<============ OPCIÓN N° 1 ============>

//<============ OPCIÓN N° 2 ============>
export const cambioDomicilioFlow = addKeyword(
  utils.setEvent('CAMBIO_DOMICILIO_CLIENTE')
).addAnswer(
  'Por favor indique cual es su nuevo domicilio, o envíe la ubicación para mas exactitud:',
  { capture: true },
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const opt = ctx.body?.trim() || '';

    if (opt == 'salir') return;

    const location = ctx?.message?.locationMessage;

    if (location) {
      const lat = location.degreesLatitude;
      const lon = location.degreesLongitude;

      await state.update({ lat, lon, ubicacion: '' });
    } else {
      await state.update({ lat: '', lon: '', ubicacion: opt });
    }

    const { nro_cliente, nombre, dni, lat, lon, ubicacion, consulta } =
      state.getMyState();

    fetch(`${envs.API_URL}v1/registros-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nro_cliente,
        nombre,
        dni,
        telefono: ctx.from,
        consulta,
        lat,
        lon,
        ubicacion,
      }),
    })
      .then(async (res) => {
        const json = await res.json(); // <-- leer el JSON de la respuesta
        let ticketId = json ? json.ticketId : 'Sin ticket asignado';

        await flowDynamic(
          `Perfecto ${state.get(
            'nombre'
          )}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
        );

        return gotoFlow(endMessageFlow);
      })
      .catch(async (err) => {
        await flowDynamic(
          `Ocurrió un error durante la obtención de la información. Error: ${JSON.stringify(
            err
          )}`
        );
        return gotoFlow(endMessageFlow);
      });
  }
);
//<============ OPCIÓN N° 2 ============>

//<============ OPCIÓN N° 3 ============>
export const aumentarVelocidadFlow = addKeyword(
  utils.setEvent('AUMENTAR_VELOCIDAD')
).addAnswer(
  '¡Muy bien!',
  null,
  async (ctx, { state, flowDynamic, gotoFlow }) => {
    const opt = ctx.body?.trim() || '';

    if (opt == 'salir') return;

    const { nro_cliente, nombre, dni, consulta } = state.getMyState();

    fetch(`${envs.API_URL}v1/registros-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nro_cliente,
        nombre,
        dni,
        telefono: ctx.from,
        consulta,
      }),
    })
      .then(async (res) => {
        const json = await res.json(); // <-- leer el JSON de la respuesta
        let ticketId = json ? json.ticketId : 'Sin ticket asignado';

        await flowDynamic(
          `${state.get(
            'nombre'
          )}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
        );

        return gotoFlow(endMessageFlow);
      })
      .catch(async (err) => {
        await flowDynamic(
          `Ocurrió un error durante la obtención de la información. Error: ${JSON.stringify(
            err
          )}`
        );
        return gotoFlow(endMessageFlow);
      });
  }
);
//<============ OPCIÓN N° 3 ============>
//<============ OPCIÓN N° 4 ============>

export const otrasConsultasFlow = addKeyword(
  utils.setEvent('OTRAS_CONSULTAS')
).addAnswer(
  'Por favor indique cuál es su consulta:',
  { capture: true },
  async (ctx, { state, flowDynamic, gotoFlow, fallBack }) => {
    let consultaTexto = ctx.body?.trim() || '';

    // 🔊 Si el usuario envía un audio (nota de voz)
    if (ctx.message?.audioMessage?.url) {
      return fallBack(
        'No es posible procesar audios, solo texto.\nPor favor indique cuál es su consulta:'
      );
    }

    if (consultaTexto.toLowerCase() === 'salir') return;

    const { nro_cliente, nombre, dni } = state.getMyState();

    try {
      const res = await fetch(`${envs.API_URL}v1/registros-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nro_cliente,
          nombre,
          dni,
          telefono: ctx.from,
          consulta: consultaTexto,
        }),
      });

      const json = await res.json();
      const ticketId = json?.ticketId || 'Sin ticket asignado';

      await flowDynamic(
        `${nombre}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
      );

      return gotoFlow(endMessageFlow);
    } catch (err) {
      await flowDynamic(
        `Ocurrió un error al registrar tu consulta. Error: ${JSON.stringify(
          err
        )}`
      );
      return gotoFlow(endMessageFlow);
    }
  }
);
//<============ OPCIÓN N° 4 ============>

const textEnd2 = '\n1. *Volver al menú*\n2. *Finalizar*';

export const endMessageFlow = addKeyword(
  utils.setEvent('END_FLOW_CLIENT')
).addAnswer(
  '¿Qué desea hacer ahora? (*solo números*)' + textEnd2,
  {
    capture: true,
    // buttons: [{ body: '1. Volver al menú' }, { body: '2. Finalizar' }],
  },
  async (ctx, { gotoFlow, endFlow, fallBack }) => {
    const opt = ctx.body.toLocaleLowerCase();

    if (opt.includes('1')) return gotoFlow(aboutClientFlow);
    if (opt.includes('2')) return endFlow('Gracias por confiar en nosotros');
    else return fallBack('Opción ingresada incorrecta');
  }
);
