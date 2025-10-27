import { addKeyword, utils } from '@builderbot/bot';
import { localidades } from '../../common/index.js';

const text = [
  { body: '1. *Hogar*' },
  { body: '2. *Comercio*' },
  { body: '3. *Empresa*' },
];

export const soporteInternetFlow = addKeyword(
  utils.setEvent('TECNICA_INTERNET')
).addAnswer(
  'Tipo de servicio:' + text.map((b) => `\n${b.body}`),
  { capture: true },
  async (ctx, { fallBack }) => {
    const opt = ctx.body.trim();
    if (!['1', '2', '3'].includes(opt))
      return fallBack('Por favor elegí 1, 2 o 3');
  }
);

export const soporteInternetLocalidadFlow = addKeyword(
  utils.setEvent('TECNICA_LOCALIDAD_INTERNET')
).addAnswer(
  '¿De qué localidad sos?:' +
    localidades.map((localidad, i) => `\n${i + 1}. ${localidad}`),
  { capture: true },
  async (ctx, { flowDynamic }) => {
    const opt = parseInt(ctx.body.trim(), 10);

    if (opt >= 11 && opt <= 13) {
      await flowDynamic(
        `📞 Servicio de *CACNET* Comunicate al WhatsApp 2984530580 o por mail a cacnet.oficina@gmail.com`
      );
      return;
    }

    //TODO Esto se saca del context
    await flowDynamic(
      `Perfecto 👍 Servicio de *CTC*. Por favor, indicá el número de teléfono, DNI o CUIT del titular de la línea.`
    );
  }
);

const textTwo = [
  { body: '1. *Cortes*' },
  { body: '2. *Lentitud*' },
  { body: '3. *Sin acceso a internet*' }, //TODO Acá podemos poner un tipo de ayuda para guiar al usuario
  { body: '4. *Otros (escribí tu caso)*' },
];

export const soporteInternetInconveniente = addKeyword(
  utils.setEvent('INTERNET_INCONVENIENTE_TECNICA')
).addAnswer(
  '¿Qué tipo de inconveniente tenés?:' + textTwo.map((b) => `\n${b.body}`),
  { capture: true },
  async (ctx, { endFlow }) => {
    return endFlow(
      `✅ ¡Perfecto! Uno de nuestros técnicos recibirá tu reclamo y seguirá curso para su pronta reparación. En caso de ser necesaria una visita, el plazo máximo es de *72hs hábiles*.`
    );
  }
);
