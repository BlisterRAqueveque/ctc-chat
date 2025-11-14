import { addKeyword, utils } from '@builderbot/bot';
import { preFinishTecnicaFlow } from './06.end-tecnica.flow.js';
import { envs } from '../../configuration/envs.js';

const soporteTelefoniaServicioButtons = [
  { body: '1. *Hogar*' },
  { body: '2. *Comercio*' },
  { body: '3. *Empresa*' },
];
const soporteTelefoniaServicioText =
  'Tipo de servicio: (*ingresa solo números*)' +
  soporteTelefoniaServicioButtons.map((s) => `\n${s.body}`);
  
export const soporteTelefoniaMainFlow = addKeyword(
  utils.setEvent('TELEFONIA_TECNICA')
).addAnswer(
  soporteTelefoniaServicioText,
  { capture: true },
  async (ctx, { gotoFlow, fallBack, state }) => {
    const opt = ctx.body.trim();

    if (opt.trim().toLowerCase() === 'salir') return;

    const servicio =
      soporteTelefoniaServicioButtons
        .map((t) => t.body)
        .find((t) => t.includes(opt))
        ?.split('. ')[1] || '';

    await state.update({ servicio });

    switch (+opt) {
      case 1:
        return gotoFlow(soporteTelefoniaLocalidadFlow);
      case 2:
        return gotoFlow(soporteTelefoniaLocalidadFlow);
      case 3:
        return gotoFlow(soporteTelefoniaLocalidadFlow);
      default:
        return fallBack(
          `Opción ingresada incorrecta.\n${soporteTelefoniaServicioText}`
        );
    }
  }
);

const localidadesButton = [
  { body: '1. *Centenario*' },
  { body: '2. *Vista Alegre*' },
];
const localidadesText =
  '¿De qué localidad sos? (*ingresa solo números*)' +
  localidadesButton.map((l) => `\n${l.body}`);

export const soporteTelefoniaLocalidadFlow = addKeyword(
  utils.setEvent('TELEFONIA_TECNICA_LOCALIDAD')
).addAnswer(
  localidadesText,
  { capture: true },
  async (ctx, { state, gotoFlow, fallBack }) => {
    const opt = ctx.body.trim();

    if (opt.trim().toLowerCase() === 'salir') return;

    const localidad =
      localidadesButton
        .map((t) => t.body)
        .find((t) => t.includes(opt))
        ?.split('. ')[1] || '';

    await state.update({ localidad });

    if (![1, 2].includes(opt))
      return fallBack(`Opción ingresada incorrecta.\n${localidadesText}`);

    return gotoFlow(soporteTelefoniaFlow);
  }
);

const soporteTelefoniaButtons = [
  { body: '1. *No tengo tono*' },
  { body: '2. *No puedo realizar llamadas*' },
  { body: '3. *No puedo recibir llamadas*' },
  { body: '4. *Ruido en la línea*' },
  { body: '5. *Otros (escribí tu caso)*' },
];

const soporteTelefoniaText =
  'Indicanos el inconveniente: (*ingresa solo números*)' +
  soporteTelefoniaButtons.map((s) => `\n${s.body}`);

export const soporteTelefoniaFlow = addKeyword(
  utils.setEvent('TELEFONIA_TECNICA_INCONVENIENTE')
).addAnswer(
  soporteTelefoniaText,
  { capture: true },
  async (ctx, { gotoFlow, fallBack, state }) => {
    const opt = ctx.body.trim();

    if (opt.trim().toLowerCase() === 'salir') return;

    const consulta =
      soporteTelefoniaButtons
        .map((t) => t.body)
        .find((t) => t.includes(opt))
        ?.split('. ')[1] || '';

    await state.update({ consulta });

    if (![1, 2, 3, 4, 5].includes(+opt))
      return fallBack(`Opción ingresada incorrecta.\n${soporteTelefoniaText}`);

    if (+opt == 5) return gotoFlow(soporteTelefoniaOtrosFlow);

    return gotoFlow(soporteTelefoniaFinFlow);
  }
);

export const soporteTelefoniaOtrosFlow = addKeyword(
  utils.setEvent('TELEFONIA_OTROS_TECNICA')
).addAnswer(
  'Describí tu inconveniente, solo texto:',
  { capture: true },
  async (ctx, { gotoFlow, state }) => {
    const consulta = ctx.body.trim();

    if (consulta.toLocaleLowerCase() == 'salir') return;

    await state.update({ consulta });

    return gotoFlow(soporteTelefoniaFinFlow);
  }
);

export const soporteTelefoniaFinFlow = addKeyword(
  utils.setEvent('TELEFONIA_TECNICA_FIN')
).addAnswer(
  'Muy bien...',
  null,
  async (ctx, { gotoFlow, flowDynamic, state }) => {
    await flowDynamic(
      'Vamos a tomar su pedido, en breves será contactado por nuestro personal para su solicitud...'
    );

    const { nro_cliente, nombre, dni, consulta, localidad, servicio } =
      state.getMyState();

    const telefono = ctx.from;

    fetch(`${envs.API_URL}v1/registros-tecnica-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nro_cliente,
        nombre,
        dni,
        telefono,
        consulta,
        localidad,
        servicio,
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
