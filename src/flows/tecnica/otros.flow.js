import { addKeyword, utils } from '@builderbot/bot';

export const soporteOtrosFlow = addKeyword(
  utils.setEvent('OTROS_TECNICA')
).addAnswer(
  `Por favor, escribí tu comentario o reclamo detallado (por ejemplo: correr un poste, mover una línea, etc).`,
  { capture: true },
  async (_, { endFlow }) => {
    return endFlow(
      `✅ ¡Perfecto! Uno de nuestros técnicos se comunicará a la brevedad para coordinar tu solicitud.`
    );
  }
);
