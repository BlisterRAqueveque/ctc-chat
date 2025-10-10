import { addKeyword, utils } from '@builderbot/bot';
import { envs } from '../configuration/envs.js';

export const mainClientFlow = addKeyword(utils.setEvent('CLIENTES')).addAnswer(
  'Bienvenido a nuestra gestión, por favor seleccione una opción para continuar:',
  {
    capture: true,
    buttons: [
      { body: '1. Quiero saber sobre mi servicio' },
      { body: '2. Necesito mi factura' },
      { body: '3. Medios de pago' },
      { body: '4. Deseo hablar con un operador' },
      { body: '5. Necesito soporte ó asistencia técnica' },
    ],
  },
  async (ctx, { gotoFlow, fallBack }) => {
    const opt = ctx.body;

    if (opt == 'salir') return;

    switch (true) {
      case opt.includes('1'):
        return gotoFlow(aboutClientFlow);
      //   case opt.includes('2'):
      //     return gotoFlow(reactivarServicioFlow);
      //   case opt.includes('3'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('4'):
      //     return gotoFlow(socioFlow);
      //   case opt.includes('5'):
      //     return gotoFlow(socioFlow);
      default:
        return fallBack('⚠️ Opción inválida.');
    }
  }
);

export const aboutClientFlow = addKeyword(
  utils.setEvent('SOBRE_SERVICIO')
).addAnswer(
  'Quiero saber sobre mi servicio',
  {
    capture: true,
    buttons: [
      { body: '1. ¿Qué servicio tengo?' },
      { body: '2. Cambio de domicilio' },
      { body: '3. Aumentar la velocidad' },
      { body: '4. Otras consultas' },
      { body: '5. Volver al menú' },
    ],
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
      //   case opt.includes('5'):
      //     return gotoFlow(socioFlow);
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
      const data = JSON.parse(state.get('miServicio'));
      await flowDynamic([`📋 ID: ${data.id}`, `📋 Datos: ${data.datos}`]);
    } catch (error) {
      await flowDynamic([
        `!Ocurrió un error durante la obtención de sus datos!`,
        `Favor de comunicarse con su proveedor.`,
        `Error: ${JSON.stringify(error)}`,
      ]);
    }

    return gotoFlow(endMessageAboutFlow);
  }
);

export const endMessageAboutFlow = addKeyword(
  utils.setEvent('END_FLOW_CLIENT')
).addAnswer(
  '¿Qué desea hacer ahora?',
  {
    capture: true,
    buttons: [
      { body: '0. Mejorar / cambiar mi servicio' },
      { body: '1. Volver al menú' },
      { body: '2. Finalizar' },
    ],
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
// export const otrasConsultasFlow = addKeyword(
//   utils.setEvent('OTRAS_CONSULTAS')
// ).addAnswer(
//   'Por favor indique cual es su consulta:',
//   { capture: true },
//   async (ctx, { state, flowDynamic, gotoFlow }) => {
//     const opt = ctx.body?.trim() || '';

//     if (opt == 'salir') return;

//     ctx.message.audio;

//     const { nro_cliente, nombre, dni } = state.getMyState();

//     fetch(`${envs.API_URL}v1/registros-cliente`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         nro_cliente,
//         nombre,
//         dni,
//         telefono: ctx.from,
//         consulta: ctx.message.audio,
//       }),
//     })
//       .then(async (res) => {
//         const json = await res.json(); // <-- leer el JSON de la respuesta
//         let ticketId = json ? json.ticketId : 'Sin ticket asignado';

//         await flowDynamic(
//           `${state.get(
//             'nombre'
//           )}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
//         );

//         return gotoFlow(endMessageFlow);
//       })
//       .catch(async (err) => {
//         await flowDynamic(
//           `Ocurrió un error durante la obtención de la información. Error: ${JSON.stringify(
//             err
//           )}`
//         );
//         return gotoFlow(endMessageFlow);
//       });
//   }
// );
// export const otrasConsultasFlow = addKeyword(
//   utils.setEvent('OTRAS_CONSULTAS')
// ).addAnswer(
//   'Por favor indique cual es su consulta:',
//   { capture: true },
//   async (ctx, { state, flowDynamic, gotoFlow }) => {
//     let consultaTexto = ctx.body?.trim() || '';

//     if (consultaTexto.toLowerCase() === 'salir') return;

//     // Si el usuario manda un audio
//     if (ctx.message?.audio || ctx.message?.voice) {
//       const audioUrl = ctx.message.audio.url; // o el campo correcto según tu lib
//       const texto = await transcribirAudio(audioUrl);
//       if (texto) consultaTexto = texto;
//       else {
//         await flowDynamic(
//           'No se pudo entender el audio. Podés repetirlo en texto, por favor?'
//         );
//         return;
//       }
//     }

//     await flowDynamic(`${JSON.stringify(ctx.message)}`);

//     const { nro_cliente, nombre, dni } = state.getMyState();

//     fetch(`${envs.API_URL}v1/registros-cliente`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         nro_cliente,
//         nombre,
//         dni,
//         telefono: ctx.from,
//         consulta: ctx.message,
//       }),
//     })
//       .then(async (res) => {
//         const json = await res.json();
//         const ticketId = json?.ticketId || 'Sin ticket asignado';

//         await flowDynamic(
//           `${nombre}! Un asesor comercial recibió tu consulta y te responderá en horario laboral (Lun-Vie 08:00 a 15:30). La consulta fue elevada con el ticket n° ${ticketId}`
//         );

//         return gotoFlow(endMessageFlow);
//       })
//       .catch(async (err) => {
//         await flowDynamic(
//           `Ocurrió un error durante la obtención de la información. Error: ${JSON.stringify(
//             err
//           )}`
//         );
//         return gotoFlow(endMessageFlow);
//       });
//   }
// );

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
      // const audioUrl = ctx.message.audioMessage.url;
      // await flowDynamic(
      //   'Recibí tu audio, estoy procesando la transcripción...'
      // );
      // const texto = await transcribirAudio(audioUrl);

      // if (texto) {
      //   consultaTexto = texto;
      //   await flowDynamic(`Esto fue lo que entendí de tu audio: "${texto}"`);
      // } else {
      //   await flowDynamic(
      //     'No se pudo entender el audio. Podés repetirlo o escribir tu consulta en texto, por favor.'
      //   );
      //   return;
      // }
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

export const endMessageFlow = addKeyword(
  utils.setEvent('END_FLOW_CLIENT')
).addAnswer(
  '¿Qué desea hacer ahora?',
  {
    capture: true,
    buttons: [{ body: '1. Volver al menú' }, { body: '2. Finalizar' }],
  },
  async (ctx, { gotoFlow, endFlow, fallBack }) => {
    const opt = ctx.body.toLocaleLowerCase();

    if (opt.includes('1')) return gotoFlow(aboutClientFlow);
    if (opt.includes('2')) return endFlow('Gracias por confiar en nosotros');
    else return fallBack('Opción ingresada incorrecta');
  }
);
