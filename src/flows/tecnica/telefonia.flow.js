import { addKeyword, utils } from '@builderbot/bot';

export const soporteTelefoniaFlow = addKeyword(
  utils.setEvent('TELEFONIA_TECNICA')
)
  .addAnswer('Tipo de servicio:\n1. *Hogar*\n2. *Comercio*\n3. *Empresa*', {
    capture: true,
  })
  .addAnswer('¿De qué localidad sos?\n1. *Centenario*\n2. *Vista Alegre*', {
    capture: true,
  })
  .addAnswer(
    'Indicanos el inconveniente:\n1. *No tengo tono*\n2. *No puedo realizar llamadas*\n3. *No puedo recibir llamadas*\n4. *Ruido en la línea*\n5. *Otros (escribí tu caso)*',
    { capture: true },
    async (_, { endFlow }) => {
      return endFlow(
        '✅ ¡Perfecto! Uno de nuestros técnicos recibirá tu reclamo.\nSi es necesario, el plazo máximo de visita técnica es de *72hs hábiles*.'
      );
    }
  );
