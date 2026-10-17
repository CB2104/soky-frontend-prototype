const descriptions: ReadonlyMap<string, string> = new Map([
  ["entradas", "Abre el apetito y dale el primer bocado a tu pedido."],
  ["rolls", "Tempura o fríos. Dos formas de encontrar tu favorito."],
  ["ensaladas", "Dinamita, Neptuno, Soky Salad o Poke Mahalo: encuentra la tuya."],
  ["tartar", "Atún o salmón: elige tu tartar."],
  ["ceviches", "Clásico o especial. Dale espacio a tu favorito."],
  ["combo-boxs", "Más piezas para compartir. Elige el box que va con tu plan."],
  ["especiales", "Burger, dog, pizza y mix, con el sello SOKY."],
  ["menu-kids", "Un espacio en el menú para los más pequeños."],
  ["postres", "Tu pedido también puede terminar con algo dulce."],
  ["bebidas", "Encuentra con qué acompañar tu pedido."],
  ["cocteles", "Daiquiri, piña colada o mojito. Tú eliges el brindis."],
]);

export function getMenuSectionDescription(slug: string): string | undefined {
  return descriptions.get(slug);
}
