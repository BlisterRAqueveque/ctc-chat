import { addKeyword, utils } from '@builderbot/bot';

export const soporteTelefoniaFlow = addKeyword(
  utils.setEvent('TELEFONIA_TECNICA')
)
  .addAnswer(
    `Tipo de servicio:  
1️⃣ Hogar  
2️⃣ Comercio  
3️⃣ Empresa`,
    { capture: true }
  )
  .addAnswer(
    `¿De qué localidad sos?  
1️⃣ Centenario  
2️⃣ Vista Alegre`,
    { capture: true }
  )
  .addAnswer(
    `Indicanos el inconveniente:  
1️⃣ No tengo tono  
2️⃣ No puedo realizar llamadas  
3️⃣ No puedo recibir llamadas  
4️⃣ Ruido en la línea  
5️⃣ Otros (escribí tu caso)`,
    { capture: true },
    async (_, { endFlow }) => {
      return endFlow(
        `✅ ¡Perfecto! Uno de nuestros técnicos recibirá tu reclamo.  
Si es necesario, el plazo máximo de visita técnica es de *72hs hábiles*.`
      );
    }
  );
