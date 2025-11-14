import { addKeyword, utils } from '@builderbot/bot';
import { localidades } from '../../common/index.js';
import { preFinishTecnicaFlow } from './06.end-tecnica.flow.js';
import { envs } from '../../configuration/envs.js';

const text = [
  { body: '1. *Hogar*' },
  { body: '2. *Comercio*' },
  { body: '3. *Empresa*' },
];
const soporteInternetText =
  'Tipo de servicio (*ingresa solo números*):' + text.map((b) => `\n${b.body}`);

export const soporteInternetFlow = addKeyword(
  utils.setEvent('TECNICA_INTERNET')
).addAnswer(
  soporteInternetText,
  { capture: true },
  async (ctx, { fallBack }) => {
    const opt = ctx.body.trim();

    if (opt.trim().toLowerCase() === 'salir') return;

    if (!['1', '2', '3'].includes(opt))
      return fallBack(`Opción ingresada incorrecta.\n${soporteInternetText}`);
  }
);

const soporteInternetLocalidadText =
  '¿De qué localidad sos? (*ingresa solo números*):' +
  localidades.map((localidad, i) => `\n${i + 1}. ${localidad}`);

export const soporteInternetLocalidadFlow = addKeyword(
  utils.setEvent('TECNICA_LOCALIDAD_INTERNET')
).addAnswer(
  soporteInternetLocalidadText,
  { capture: true },
  async (ctx, { flowDynamic, gotoFlow, fallBack, state }) => {
    const opt = parseInt(ctx.body.trim());

    const opciones = Array.from(
      { length: localidades.length },
      (_, i) => i + 1
    );

    if (opt.toLocaleString().toLocaleLowerCase() == 'salir') return;

    if (!opciones.includes(+opt))
      return fallBack(
        `Opción ingresada incorrecta.\n${soporteInternetLocalidadText}`
      );

    // Las opciones 11, 12 y 13 no son por Centenario
    if (opt >= 11 && opt <= 13) {
      await flowDynamic(
        'Servicio de *CACNET* Comunicate al WhatsApp 2984530580 o por mail a cacnet.oficina@gmail.com'
      );

      const localidad = localidades[opt - 1];
      await state.update({ localidad });

      return gotoFlow(preFinishTecnicaFlow);
    }

    return gotoFlow(soporteInternetInconveniente);
  }
);

const textTwo = [
  { body: '1. *Cortes*' },
  { body: '2. *Lentitud*' },
  { body: '3. *Sin acceso a internet*' },
  { body: '4. *Otros (escribí tu caso)*' },
];

const soporteInternetInconvenienteText =
  '¿Qué tipo de inconveniente tenés? (*ingresa solo números*):' +
  textTwo.map((b) => `\n${b.body}`);
export const soporteInternetInconveniente = addKeyword(
  utils.setEvent('INTERNET_INCONVENIENTE_TECNICA')
).addAnswer(
  soporteInternetInconvenienteText,
  { capture: true },
  async (ctx, { gotoFlow, state, fallBack }) => {
    const opt = ctx.body.trim();

    if (opt.trim().toLowerCase() === 'salir') return;

    const consulta =
      textTwo
        .map((t) => t.body)
        .find((t) => t.includes(opt))
        ?.split('. ')[1] || '';

    await state.update({ consulta });

    switch (+opt) {
      case 1:
        return gotoFlow(soporteInternetFinFlow);
      case 2:
        return gotoFlow(soporteInternetFinFlow);
      case 3:
        return gotoFlow(sinAccesoInternetFlow);
      case 4:
        return gotoFlow(soporteInternetOtrosFlow);
      default:
        return fallBack(
          `Opción ingresada incorrecta.\n${soporteInternetInconvenienteText}`
        );
    }
  }
);

export const sinAccesoInternetFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA')
).addAnswer(
  'Antes de continuar, vamos a verificar ciertos pasos previos.',
  null,
  async (_, { flowDynamic, gotoFlow }) => {
    await flowDynamic([
      'Primeramente, le pedimos que se encuentre en su domicilio, y cerca del modem.',
      'Segundo, responda cada pregunta con si o no',
    ]);

    return gotoFlow(sinAccesoInternetUnoFlow);
  }
);

const solucionText = '¿Esto soluciona el inconveniente? (si/no)';
export const sinAccesoInternetUnoFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA_UNO')
).addAnswer(
  `1. 🔌 Mirá si el módem o router está enchufado.\n${solucionText}`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (opt) {
      case 'si': {
        await flowDynamic(
          'Que bueno que se haya solucionado su inconveniente. ¡Nunca dude en contactarnos!'
        );
        return gotoFlow(preFinishTecnicaFlow);
      }
      case 'no':
        return gotoFlow(sinAccesoInternetDosFlow);
      default:
        return fallBack(`Opción ingresada incorrecta.\n${solucionText}`);
    }
  }
);

export const sinAccesoInternetDosFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA_DOS')
).addAnswer(
  `2. 💡 Fijate si tiene luces prendidas. Caso contrario, revisa que esté correctamente enchufado o probá otro enchufe.\n${solucionText}`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (opt) {
      case 'si': {
        await flowDynamic(
          'Que bueno que se haya solucionado su inconveniente. ¡Nunca dude en contactarnos!'
        );
        return gotoFlow(preFinishTecnicaFlow);
      }
      case 'no':
        return gotoFlow(sinAccesoInternetTresFlow);
      default:
        return fallBack(`Opción ingresada incorrecta.\n${solucionText}`);
    }
  }
);

export const sinAccesoInternetTresFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA_TRES')
).addAnswer(
  `3. 📱 Probá en otro aparato.\nEn caso que tenga otro modem, probá cambiando el modem; es tan sencillo como quitar el cable de internet, y colocarlo en el otro.\n${solucionText}`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (opt) {
      case 'si': {
        await flowDynamic(
          'Que bueno que se haya solucionado su inconveniente. ¡Nunca dude en contactarnos!'
        );
        return gotoFlow(preFinishTecnicaFlow);
      }
      case 'no':
        return gotoFlow(sinAccesoInternetCuatroFlow);
      default:
        return fallBack(`Opción ingresada incorrecta.\n${solucionText}`);
    }
  }
);

export const sinAccesoInternetCuatroFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA_CUATRO')
).addAnswer(
  `4. 📡 Fijate si te conectás al Wi-Fi correcto.\n${solucionText}`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (opt) {
      case 'si': {
        await flowDynamic(
          'Que bueno que se haya solucionado su inconveniente. ¡Nunca dude en contactarnos!'
        );
        return gotoFlow(preFinishTecnicaFlow);
      }
      case 'no':
        return gotoFlow(sinAccesoInternetCincoFlow);
      default:
        return fallBack(`Opción ingresada incorrecta.\n${solucionText}`);
    }
  }
);

export const sinAccesoInternetCincoFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA_CINCO')
).addAnswer(
  `5. 🔁 Por último, apagá el módem, espera 30 segundos, y volvé a prenderlo.\n${solucionText}`,
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const opt = ctx.body.trim().toLocaleLowerCase();

    if (opt == 'salir') return;

    switch (opt) {
      case 'si': {
        await flowDynamic(
          'Que bueno que se haya solucionado su inconveniente. ¡Nunca dude en contactarnos!'
        );
        return gotoFlow(preFinishTecnicaFlow);
      }
      case 'no':
        return gotoFlow(soporteInternetFinFlow);
      default:
        return fallBack(`Opción ingresada incorrecta.\n${solucionText}`);
    }
  }
);

export const soporteInternetOtrosFlow = addKeyword(
  utils.setEvent('INTERNET_OTROS_TECNICA')
).addAnswer(
  'Describí tu inconveniente, solo texto:',
  { capture: true },
  async (ctx, { gotoFlow, state }) => {
    const consulta = ctx.body.trim();

    if (consulta.toLocaleLowerCase() == 'salir') return;

    await state.update({ consulta });

    return gotoFlow(soporteInternetFinFlow);
  }
);

export const soporteInternetFinFlow = addKeyword(
  utils.setEvent('INTERNET_CORTE_TECNICA_FIN')
).addAnswer(
  'Muy bien...',
  null,
  async (ctx, { gotoFlow, flowDynamic, state }) => {
    await flowDynamic(
      'Vamos a tomar su pedido, en breves será contactado por nuestro personal para su solicitud...'
    );

    const { nro_cliente, nombre, dni, consulta, localidad } =
      state.getMyState();

    const telefono = ctx.from;

    fetch(`${envs.API_URL}api/v1/soporte/solicitud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nro_cliente,
        nombre,
        dni,
        telefono,
        consulta,
        localidad,
      }),
    })
      .then(async (res) => {
        const json = await res.json(); // <-- leer el JSON de la respuesta
        let ticketId = json ? json.ticketId : 'Sin ticket asignado';

        await flowDynamic(
          `¡Perfecto! Uno de nuestros técnicos recibirá tu reclamo y seguirá curso para su pronta reparación. En caso de ser necesaria una visita, el plazo máximo es de *72hs hábiles*. La consulta fue elevada con el ticket n° ${ticketId}`
        );

        return gotoFlow(preFinishTecnicaFlow);
      })
      .catch(async (err) => {
        console.error(err);
        await flowDynamic(
          'Ocurrió un error al registrar tu reclamo. Por favor, intentá más tarde.'
        );
        return gotoFlow(preFinishTecnicaFlow);
      });
  }
);
